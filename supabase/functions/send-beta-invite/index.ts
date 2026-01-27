// Edge function to send beta tester invitation emails via Resend

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'https://glory.app';

interface BetaInviteRequest {
  email: string;
  code: string;
  invitedBy?: string; // admin username
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const { email, code, invitedBy }: BetaInviteRequest = await req.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const inviteUrl = `${APP_URL}/beta/${code}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GLORY Beta Invitation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #1a1a1a; border-radius: 16px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                GLORY
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Beta Tester Invitation
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px; font-weight: 600;">
                You're Invited!
              </h2>

              <p style="margin: 0 0 20px; color: #a0a0a0; font-size: 16px; line-height: 1.6;">
                You've been selected to join the exclusive GLORY beta testing program. Help shape the future of real-time connection.
              </p>

              <!-- Requirements Box -->
              <div style="background-color: #252525; border-radius: 12px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 16px; color: #ffffff; font-size: 18px; font-weight: 600;">
                  Program Requirements
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #a0a0a0; font-size: 14px; line-height: 1.8;">
                  <li>Engage with the app for <strong style="color: #a855f7;">1 hour per week</strong></li>
                  <li>Complete <strong style="color: #a855f7;">10 consecutive weeks</strong></li>
                  <li>Submit bug reports and feedback</li>
                </ul>
              </div>

              <!-- Reward Box -->
              <div style="background: linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(168,85,247,0.2) 100%); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                <p style="margin: 0 0 8px; color: #a0a0a0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  Your Reward
                </p>
                <p style="margin: 0; color: #a855f7; font-size: 24px; font-weight: 700;">
                  Lifetime Free Premium
                </p>
                <p style="margin: 10px 0 0; color: #a0a0a0; font-size: 14px;">
                  Forever. No strings attached.
                </p>
              </div>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">
                      Join the Beta
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Invite Code -->
              <div style="text-align: center; margin: 20px 0;">
                <p style="margin: 0 0 8px; color: #666666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                  Your Invite Code
                </p>
                <p style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 4px; font-family: monospace;">
                  ${code}
                </p>
              </div>

              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6; text-align: center;">
                This invitation expires in 7 days. Limited spots available.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #151515; border-top: 1px solid #252525;">
              <p style="margin: 0; color: #666666; font-size: 12px; text-align: center; line-height: 1.6;">
                You're receiving this because ${invitedBy ? `@${invitedBy}` : 'an admin'} invited you to the GLORY beta program.
                <br><br>
                If you didn't request this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailText = `
GLORY Beta Tester Invitation

You've been invited to join the exclusive GLORY beta testing program!

PROGRAM REQUIREMENTS:
- Engage with the app for 1 hour per week
- Complete 10 consecutive weeks
- Submit bug reports and feedback

YOUR REWARD:
Lifetime Free Premium - Forever. No strings attached.

Join the beta: ${inviteUrl}

Your invite code: ${code}

This invitation expires in 7 days.

---
You're receiving this because ${invitedBy ? `@${invitedBy}` : 'an admin'} invited you to the GLORY beta program.
    `;

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GLORY <beta@glory.app>',
        to: [email],
        subject: "You're Invited to the GLORY Beta",
        html: emailHtml,
        text: emailText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
      throw new Error(errorData.message || 'Failed to send email');
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: unknown) {
    console.error('Error sending beta invite:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
