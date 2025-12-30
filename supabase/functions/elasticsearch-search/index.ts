import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiter
const rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();

function checkRateLimit(ip: string, maxRequests: number = 30, windowMs: number = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  
  // Clean old entries
  if (Math.random() < 0.1) {
    for (const [k, v] of rateLimitStore) {
      if (now > v.resetTime) rateLimitStore.delete(k);
    }
  }
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         req.headers.get('cf-connecting-ip') || 
         'unknown';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  const rateLimit = checkRateLimit(clientIP, 30, 60000); // 30 requests per minute
  
  if (!rateLimit.allowed) {
    console.log('Rate limit exceeded for IP:', clientIP);
    return new Response(
      JSON.stringify({ success: false, error: 'Demasiadas solicitudes. Espera un momento.' }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60'
        } 
      }
    );
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

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has active API key
    const { data: apiKey, error: keyError } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (keyError || !apiKey) {
      console.error('No active API key:', keyError);
      return new Response(
        JSON.stringify({ success: false, error: 'No tienes una API key activa. Por favor, adquiere un plan.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if key is expired
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tu API key ha expirado. Por favor, renueva tu plan.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check request limit
    if (apiKey.requests_used >= apiKey.requests_limit) {
      return new Response(
        JSON.stringify({ success: false, error: 'Has alcanzado el límite de búsquedas de tu plan.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, index } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const elasticsearchUrl = Deno.env.get('ELASTICSEARCH_NGROK_URL');
    const elasticsearchApiKey = Deno.env.get('ELASTICSEARCH_API_KEY');

    if (!elasticsearchUrl) {
      console.error('Elasticsearch URL not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Elasticsearch no está configurado. Contacta al administrador.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching Elasticsearch for:', query, 'URL:', elasticsearchUrl, 'IP:', clientIP);

    // Build headers for Elasticsearch
    const esHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add API key if provided
    if (elasticsearchApiKey) {
      esHeaders['Authorization'] = `ApiKey ${elasticsearchApiKey}`;
    }

    // Search in Elasticsearch
    const searchIndex = index || '_all';
    const searchUrl = `${elasticsearchUrl}/${searchIndex}/_search`;
    
    console.log('Elasticsearch search URL:', searchUrl);

    const esResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: esHeaders,
      body: JSON.stringify({
        query: {
          query_string: {
            query: `*${query}*`,
            default_operator: "OR",
            analyze_wildcard: true
          }
        },
        size: 100
      }),
    });

    console.log('Elasticsearch response status:', esResponse.status);

    if (!esResponse.ok) {
      const errorText = await esResponse.text();
      console.error('Elasticsearch error:', errorText);
      
      // Try alternative query format
      console.log('Trying alternative query format...');
      const altResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: esHeaders,
        body: JSON.stringify({
          query: {
            multi_match: {
              query: query,
              fields: ["*"],
              type: "phrase_prefix"
            }
          },
          size: 100
        }),
      });

      if (!altResponse.ok) {
        const altError = await altResponse.text();
        console.error('Alternative query also failed:', altError);
        return new Response(
          JSON.stringify({ success: false, error: 'Error al buscar en Elasticsearch. Verifica la configuración.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const altData = await altResponse.json();
      const altHits = altData.hits?.hits || [];
      const altResults = altHits.map((hit: any) => ({
        id: hit._id,
        index: hit._index,
        score: hit._score,
        data: hit._source
      }));

      // Update requests_used
      const serviceClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await serviceClient
        .from('api_keys')
        .update({ requests_used: apiKey.requests_used + 1 })
        .eq('id', apiKey.id);

      await serviceClient
        .from('search_logs')
        .insert({
          user_id: user.id,
          query: query,
          results_count: altResults.length
        });

      return new Response(
        JSON.stringify({ 
          success: true, 
          results: altResults,
          total: altData.hits?.total?.value || altResults.length,
          remaining: apiKey.requests_limit - apiKey.requests_used - 1
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const esData = await esResponse.json();
    const hits = esData.hits?.hits || [];
    const results = hits.map((hit: any) => ({
      id: hit._id,
      index: hit._index,
      score: hit._score,
      data: hit._source
    }));

    // Update requests_used using service role for the update
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await serviceClient
      .from('api_keys')
      .update({ requests_used: apiKey.requests_used + 1 })
      .eq('id', apiKey.id);

    // Log the search
    await serviceClient
      .from('search_logs')
      .insert({
        user_id: user.id,
        query: query,
        results_count: results.length
      });

    console.log('Search completed, found:', results.length, 'results');

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        total: esData.hits?.total?.value || results.length,
        remaining: apiKey.requests_limit - apiKey.requests_used - 1
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in elasticsearch-search:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
