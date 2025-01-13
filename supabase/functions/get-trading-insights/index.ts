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
            content: `You are a cryptocurrency trading expert. Analyze the current market conditions and provide insights. 
            Return ONLY a valid JSON object with this exact structure, no other text:
            {
              "recommendation": "buy",
              "confidence": 0.75,
              "reasoning": "Clear explanation here",
              "risks": ["risk1", "risk2", "risk3"],
              "opportunities": ["opportunity1", "opportunity2", "opportunity3"]
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
    console.log('Raw Perplexity response:', JSON.stringify(data));

    const content = data.choices[0]?.message?.content;
    if (!content) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response from Perplexity');
    }

    // Try to parse the content as JSON, handling both string and object cases
    let insight;
    try {
      // Check if content is already an object
      if (typeof content === 'object') {
        insight = content;
      } else {
        // Try to parse it as JSON string
        insight = JSON.parse(content);
      }
      
      console.log('Parsed insight:', insight);

      // Validate the insight structure
      if (!insight.recommendation || 
          typeof insight.confidence !== 'number' || 
          !insight.reasoning ||
          !Array.isArray(insight.risks) ||
          !Array.isArray(insight.opportunities)) {
        throw new Error('Invalid insight format');
      }

      // Ensure recommendation is one of the expected values
      if (!['buy', 'sell', 'hold'].includes(insight.recommendation)) {
        throw new Error('Invalid recommendation value');
      }

      // Ensure confidence is between 0 and 1
      if (insight.confidence < 0 || insight.confidence > 1) {
        insight.confidence = Math.max(0, Math.min(1, insight.confidence));
      }

      return new Response(JSON.stringify(insight), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Error parsing content:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse Perplexity response');
    }

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