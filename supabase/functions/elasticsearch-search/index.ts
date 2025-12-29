import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    if (!elasticsearchUrl || !elasticsearchApiKey) {
      console.error('Elasticsearch not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Elasticsearch no está configurado. Contacta al administrador.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching Elasticsearch for:', query);

    // Search in Elasticsearch
    const searchIndex = index || '_all';
    const esResponse = await fetch(`${elasticsearchUrl}/${searchIndex}/_search`, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${elasticsearchApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          multi_match: {
            query: query,
            fields: ["*"],
            type: "best_fields",
            fuzziness: "AUTO"
          }
        },
        size: 100
      }),
    });

    if (!esResponse.ok) {
      const errorText = await esResponse.text();
      console.error('Elasticsearch error:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Error al buscar en Elasticsearch' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
