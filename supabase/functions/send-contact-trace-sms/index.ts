// Edge function to send anonymous contact trace SMS via Twilio

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_MESSAGING_SERVICE_SID = Deno.env.get('TWILIO_MESSAGING_SERVICE_SID');

interface ContactTraceSmsRequest {
  phone_number: string;
  sti_type: string;
  time_ago_text: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// STI display names
const STI_LABELS: Record<string, string> = {
  chlamydia: 'Chlamydia',
  gonorrhea: 'Gonorrhoea',
  syphilis: 'Syphilis',
  hiv: 'HIV',
  herpes: 'Herpes',
  hpv: 'HPV',
  mpox: 'Mpox',
  other: 'an STI',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_MESSAGING_SERVICE_SID) {
      throw new Error('Twilio credentials are not configured');
    }

    const { phone_number, sti_type, time_ago_text }: ContactTraceSmsRequest = await req.json();

    if (!phone_number || !sti_type || !time_ago_text) {
      return new Response(
        JSON.stringify({ error: 'phone_number, sti_type, and time_ago_text are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stiLabel = STI_LABELS[sti_type] || sti_type;

    // Compose anonymous message - intentionally vague to protect privacy
    const message = `GLORY Health Alert: Someone you were with ${time_ago_text} has tested positive for ${stiLabel}. We recommend getting tested. This message is anonymous - no identifying information has been shared. Reply STOP to opt out.`;

    // Send SMS via Twilio
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append('To', phone_number);
    formData.append('MessagingServiceSid', TWILIO_MESSAGING_SERVICE_SID);
    formData.append('Body', message);

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Twilio API error:', errorData);
      throw new Error(errorData.message || 'Failed to send SMS');
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.sid }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: unknown) {
    console.error('Error sending contact trace SMS:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send SMS';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
