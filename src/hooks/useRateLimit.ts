// Rate limiting hook for client-side rate limit checks
// Use this before sensitive actions like sending messages, OTP requests, etc.

import { supabase } from '@/lib/supabase';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: string;
  limit: number;
}

export async function checkRateLimit(
  action: string,
  identifier: string
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabase.functions.invoke('rate-limit', {
      body: { action, identifier },
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      // Fail open - allow the request if rate limiting fails
      return { allowed: true, remaining: 100, resetAt: '', limit: 100 };
    }

    return data as RateLimitResult;
  } catch (err) {
    console.error('Rate limit error:', err);
    return { allowed: true, remaining: 100, resetAt: '', limit: 100 };
  }
}

// Pre-configured rate limit checks for common actions
export const RateLimiter = {
  async checkOtpRequest(phone: string): Promise<RateLimitResult> {
    return checkRateLimit('otp_request', phone);
  },

  async checkOtpVerify(phone: string): Promise<RateLimitResult> {
    return checkRateLimit('otp_verify', phone);
  },

  async checkSendMessage(userId: string): Promise<RateLimitResult> {
    return checkRateLimit('send_message', userId);
  },

  async checkSendImage(userId: string): Promise<RateLimitResult> {
    return checkRateLimit('send_image', userId);
  },

  async checkReportUser(userId: string): Promise<RateLimitResult> {
    return checkRateLimit('report_user', userId);
  },

  async checkLogEncounter(userId: string): Promise<RateLimitResult> {
    return checkRateLimit('log_encounter', userId);
  },

  async checkContactTrace(userId: string): Promise<RateLimitResult> {
    return checkRateLimit('send_trace', userId);
  },
};
