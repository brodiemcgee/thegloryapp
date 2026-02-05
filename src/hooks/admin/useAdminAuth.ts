'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import React from 'react';

type AdminRole = 'super_admin' | 'admin' | 'moderator' | null;

interface AdminProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface AdminAuthContextType {
  user: User | null;
  adminRole: AdminRole;
  adminRoleId: string | null;
  adminProfile: AdminProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole>(null);
  const [adminRoleId, setAdminRoleId] = useState<string | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = useCallback(async (userId: string) => {
    try {
      // Check if user has an admin role
      const { data: adminData, error: adminError } = await supabase
        .from('admin_roles')
        .select('id, role, status, profile_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (adminError || !adminData) {
        setAdminRole(null);
        setAdminRoleId(null);
        setAdminProfile(null);
        return;
      }

      setAdminRole(adminData.role as AdminRole);
      setAdminRoleId(adminData.id);

      // Get profile info
      if (adminData.profile_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', adminData.profile_id)
          .single();

        if (profileData) {
          setAdminProfile(profileData);
        }
      }

      // Update last admin login
      await supabase
        .from('admin_roles')
        .update({ last_admin_login: new Date().toISOString() })
        .eq('id', adminData.id);

    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking admin status:', error);
      }
      setAdminRole(null);
      setAdminRoleId(null);
      setAdminProfile(null);
    }
  }, []);

  const refreshAdminStatus = useCallback(async () => {
    if (user) {
      await checkAdminStatus(user.id);
    }
  }, [user, checkAdminStatus]);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await checkAdminStatus(session.user.id);
        }
      } catch (error) {
        console.error('[AdminAuth] Error getting session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await checkAdminStatus(session.user.id);
        } else {
          setUser(null);
          setAdminRole(null);
          setAdminRoleId(null);
          setAdminProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [checkAdminStatus]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdminRole(null);
    setAdminRoleId(null);
    setAdminProfile(null);
  };

  const value: AdminAuthContextType = {
    user,
    adminRole,
    adminRoleId,
    adminProfile,
    isAdmin: adminRole !== null,
    isSuperAdmin: adminRole === 'super_admin',
    isLoading,
    signOut,
    refreshAdminStatus,
  };

  return React.createElement(AdminAuthContext.Provider, { value }, children);
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Hook for checking specific permissions
export function useAdminPermission(requiredRole: 'super_admin' | 'admin' | 'moderator') {
  const { adminRole, isLoading } = useAdminAuth();

  const roleHierarchy: Record<string, number> = {
    moderator: 1,
    admin: 2,
    super_admin: 3,
  };

  const hasPermission = adminRole
    ? roleHierarchy[adminRole] >= roleHierarchy[requiredRole]
    : false;

  return { hasPermission, isLoading };
}
