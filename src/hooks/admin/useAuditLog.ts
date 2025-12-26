'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminAuth } from './useAdminAuth';

type ResourceType =
  | 'user'
  | 'report'
  | 'photo'
  | 'location'
  | 'message'
  | 'appeal'
  | 'admin'
  | 'setting';

type ActionType =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'suspend'
  | 'ban'
  | 'unban'
  | 'verify'
  | 'unverify'
  | 'warn'
  | 'assign'
  | 'resolve'
  | 'dismiss'
  | 'escalate'
  | 'approve'
  | 'reject'
  | 'uphold'
  | 'overturn';

interface AuditLogParams {
  action: ActionType;
  resourceType: ResourceType;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export function useAuditLog() {
  const { adminRoleId } = useAdminAuth();

  const logAction = useCallback(async ({
    action,
    resourceType,
    resourceId,
    details = {},
  }: AuditLogParams): Promise<boolean> => {
    if (!adminRoleId) {
      console.warn('Cannot log action: no admin role ID');
      return false;
    }

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          admin_id: adminRoleId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          // Note: IP address and user agent would typically be captured server-side
          // For client-side logging, we omit these
        });

      if (error) {
        console.error('Failed to log audit action:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging audit action:', error);
      return false;
    }
  }, [adminRoleId]);

  // Convenience methods for common actions
  const logView = useCallback((resourceType: ResourceType, resourceId: string) =>
    logAction({ action: 'view', resourceType, resourceId }), [logAction]);

  const logModeration = useCallback((
    action: 'suspend' | 'ban' | 'unban' | 'verify' | 'unverify' | 'warn',
    userId: string,
    details?: Record<string, unknown>
  ) => logAction({ action, resourceType: 'user', resourceId: userId, details }), [logAction]);

  const logReportAction = useCallback((
    action: 'assign' | 'resolve' | 'dismiss' | 'escalate',
    reportId: string,
    details?: Record<string, unknown>
  ) => logAction({ action, resourceType: 'report', resourceId: reportId, details }), [logAction]);

  const logPhotoAction = useCallback((
    action: 'approve' | 'reject',
    photoId: string,
    details?: Record<string, unknown>
  ) => logAction({ action, resourceType: 'photo', resourceId: photoId, details }), [logAction]);

  const logAppealAction = useCallback((
    action: 'uphold' | 'overturn',
    appealId: string,
    details?: Record<string, unknown>
  ) => logAction({ action, resourceType: 'appeal', resourceId: appealId, details }), [logAction]);

  return {
    logAction,
    logView,
    logModeration,
    logReportAction,
    logPhotoAction,
    logAppealAction,
  };
}
