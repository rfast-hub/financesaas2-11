import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradingInsight {
  recommendation: string;
  confidence: number;
  reasoning: string;
  price_target?: number;
  timeframe: string;
}

async function generateTradingInsights(cryptocurrency: string): Promise<TradingInsight> {
  const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    console.log(`Generating trading insights for ${cryptocurrency}...`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency trading expert. Provide analysis in JSON format only with the following structure: {"recommendation": "buy" | "sell" | "hold", "confidence": number between 0-1, "reasoning": string, "price_target": number | null, "timeframe": string}'
          },
          {
            role: 'user',
            content: `Analyze the current market conditions for ${cryptocurrency} and provide trading insights.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid response from OpenAI');
    }

    const insight: TradingInsight = JSON.parse(content);
    
    // Validate the response
    if (!insight.recommendation || !insight.confidence || !insight.reasoning || !insight.timeframe) {
      throw new Error('Invalid insight format');
    }

    if (!['buy', 'sell', 'hold'].includes(insight.recommendation.toLowerCase())) {
      throw new Error('Invalid recommendation');
    }

    if (insight.confidence < 0 || insight.confidence > 1) {
      throw new Error('Invalid confidence score');
    }

    return insight;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw new Error(`Failed to generate insights: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cryptocurrency } = await req.json();
    
    if (!cryptocurrency) {
      throw new Error('Cryptocurrency parameter is required');
    }

    console.log(`Processing request for ${cryptocurrency}`);
    const insights = await generateTradingInsights(cryptocurrency);

    return new Response(
      JSON.stringify(insights),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error in get-trading-insights:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to generate trading insights',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});