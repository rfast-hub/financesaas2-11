import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured');
    }

    const { cryptocurrency } = await req.json();
    
    console.log('Creating AI alert for:', cryptocurrency);

    // Get market analysis from Perplexity
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency market analyst. Analyze the current market conditions and suggest alert conditions. Keep responses concise and focused on actionable insights.'
          },
          {
            role: 'user',
            content: `Analyze the current market conditions for ${cryptocurrency} and suggest specific price levels or conditions for setting alerts. Include a brief explanation of why these levels are significant.`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, response.statusText);
      throw new Error('Failed to get response from Perplexity');
    }

    const result = await response.json();
    const analysis = result.choices[0].message.content;

    // Create alerts based on AI analysis
    const { data: { user } } = await supabase.auth.getUser({ req });
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Extract price levels from AI analysis and create alerts
    // This is a simple implementation - you might want to use more sophisticated parsing
    const priceMatch = analysis.match(/\$[\d,]+\.?\d*/);
    if (priceMatch) {
      const suggestedPrice = parseFloat(priceMatch[0].replace(/[$,]/g, ''));
      
      await supabase.from('price_alerts').insert([
        {
          cryptocurrency,
          target_price: suggestedPrice,
          condition: 'above',
          user_id: user.id,
          email_notification: true,
          ai_generated: true,
          ai_reasoning: analysis
        }
      ]);
    }
    
    return new Response(
      JSON.stringify({ 
        message: "AI alert created successfully",
        analysis 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in create-ai-alert function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
})