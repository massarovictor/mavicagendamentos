import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, senha } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // No Supabase, para usar funções de criptografia, o ideal é criar uma função no próprio DB.
    // RPC (Remote Procedure Call) é a forma de chamar essa função.
    const { data, error } = await supabase.rpc('verificar_senha', {
      p_email: email,
      p_senha: senha
    });

    if (error || !data) {
      throw new Error('Credenciais inválidas');
    }
    
    // Se a verificação for bem-sucedida, a função RPC retorna os dados do usuário.
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    const message = err?.message ?? String(err);
    const status = message === 'Credenciais inválidas' ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status,
    });
  }
});
