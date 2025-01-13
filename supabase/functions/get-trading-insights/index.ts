import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradingInsight {
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
  reasoning: string;
  risks: string[];
  opportunities: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting trading insights generation...');
    
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
            You must respond with ONLY a JSON object in this exact format, with no additional text or explanation:
            {
              "recommendation": "buy" | "sell" | "hold",
              "confidence": 0.75,
              "reasoning": "Brief market analysis explaining the recommendation",
              "risks": ["Risk 1", "Risk 2", "Risk 3"],
              "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"]
            }
            The recommendation MUST be exactly "buy", "sell", or "hold".
            The confidence MUST be a number between 0 and 1.`
          },
          {
            role: 'user',
            content: 'Analyze the current cryptocurrency market conditions and provide trading insights.'
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
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw Perplexity response:', JSON.stringify(data));

    const content = data.choices[0]?.message?.content;
    if (!content) {
      console.error('Invalid response structure:', data);
      throw new Error('Invalid response from Perplexity');
    }

    let insight: TradingInsight;
    try {
      // Parse the content, handling both string and object cases
      insight = typeof content === 'object' ? content : JSON.parse(content);
      console.log('Parsed insight:', insight);

      // Validate recommendation
      if (!['buy', 'sell', 'hold'].includes(insight.recommendation)) {
        console.error('Invalid recommendation:', insight.recommendation);
        throw new Error('Invalid recommendation value');
      }

      // Validate confidence
      if (typeof insight.confidence !== 'number' || insight.confidence < 0 || insight.confidence > 1) {
        console.error('Invalid confidence value:', insight.confidence);
        insight.confidence = Math.max(0, Math.min(1, insight.confidence));
      }

      // Validate other required fields
      if (!insight.reasoning || !Array.isArray(insight.risks) || !Array.isArray(insight.opportunities)) {
        console.error('Missing required fields:', insight);
        throw new Error('Missing required fields in insight');
      }

      return new Response(JSON.stringify(insight), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error parsing or validating insight:', error);
      console.error('Raw content:', content);
      throw new Error(`Failed to parse or validate insight: ${error.message}`);
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