import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating trading insights using Perplexity...');
    
    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: `You are a cryptocurrency trading expert. Analyze the current market conditions and provide insights in this exact JSON format:
            {
              "recommendation": "buy" | "sell" | "hold",
              "confidence": <number between 0-1>,
              "reasoning": "<clear explanation>",
              "risks": ["<specific risk 1>", "<specific risk 2>", "<specific risk 3>"],
              "opportunities": ["<specific opportunity 1>", "<specific opportunity 2>", "<specific opportunity 3>"]
            }`
          },
          {
            role: 'user',
            content: 'Analyze the current market conditions for Bitcoin and major cryptocurrencies. Provide trading insights and recommendations.'
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
        presence_penalty: 0,
        frequency_penalty: 1
      }),
    });

    if (!response.ok) {
      console.error('Perplexity API error:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Perplexity response:', JSON.stringify(data));

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid response from Perplexity');
    }

    // Parse the JSON string from the content
    let insight;
    try {
      insight = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing Perplexity response:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse Perplexity response');
    }

    // Validate the response structure
    if (!insight.recommendation || 
        typeof insight.confidence !== 'number' || 
        !insight.reasoning ||
        !Array.isArray(insight.risks) ||
        !Array.isArray(insight.opportunities)) {
      console.error('Invalid insight format:', insight);
      throw new Error('Invalid insight format from Perplexity');
    }

    return new Response(JSON.stringify(insight), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-trading-insights:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate trading insights',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});