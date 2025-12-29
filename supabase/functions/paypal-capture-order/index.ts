import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PAYPAL_API_URL = Deno.env.get('PAYPAL_MODE') === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = btoa(`${clientId}:${clientSecret}`);
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('Failed to authenticate with PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "osint_";
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

const planLimits: Record<string, number> = {
  'básico': 100,
  'basico': 100,
  'pro': 1000,
  'empresa': 999999,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order ID es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Capturing PayPal order:', orderId);

    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!captureResponse.ok) {
      const error = await captureResponse.text();
      console.error('PayPal capture error:', error);
      throw new Error('Failed to capture PayPal payment');
    }

    const captureData = await captureResponse.json();
    console.log('PayPal capture response:', JSON.stringify(captureData));

    if (captureData.status !== 'COMPLETED') {
      throw new Error(`Payment not completed: ${captureData.status}`);
    }

    // Get plan from custom_id
    const customId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id 
      || captureData.purchase_units?.[0]?.custom_id;
    
    let plan = 'básico';
    try {
      const customData = JSON.parse(customId);
      plan = customData.plan || 'básico';
    } catch {
      console.log('Could not parse custom_id, using default plan');
    }

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update payment status
    await serviceClient
      .from('payments')
      .update({ status: 'completed' })
      .eq('transaction_id', orderId);

    // Generate API key
    const apiKeyValue = generateApiKey();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const requestsLimit = planLimits[plan.toLowerCase()] || 100;

    // Deactivate any existing active keys
    await serviceClient
      .from('api_keys')
      .update({ status: 'inactive' })
      .eq('user_id', user.id)
      .eq('status', 'active');

    // Create new API key
    const { data: newKey, error: keyError } = await serviceClient
      .from('api_keys')
      .insert({
        user_id: user.id,
        key_value: apiKeyValue,
        plan: plan.toLowerCase(),
        status: 'active',
        requests_limit: requestsLimit,
        requests_used: 0,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (keyError) {
      console.error('Error creating API key:', keyError);
      throw new Error('Failed to create API key');
    }

    console.log('API key created successfully for user:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Pago completado exitosamente',
        apiKey: apiKeyValue,
        plan: plan,
        expiresAt: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
