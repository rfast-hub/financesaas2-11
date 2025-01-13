import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradingInsight {
  recommendation: string;
  confidence: number;
  reasoning: string;
  risks: string[];
  opportunities: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating trading insights...');
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a cryptocurrency trading expert. Provide analysis in a strict JSON format with the following structure:
            {
              "recommendation": "buy" | "sell" | "hold",
              "confidence": <number between 0-1>,
              "reasoning": "<string explaining the recommendation>",
              "risks": ["<risk1>", "<risk2>", ...],
              "opportunities": ["<opportunity1>", "<opportunity2>", ...]
            }`
          },
          {
            role: 'user',
            content: 'Analyze the current market conditions for Bitcoin and provide trading insights.'
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      const errorData = await response.text();
      console.error('Error details:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data));

    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Invalid response from OpenAI');
    }

    // Parse the JSON string from the content
    let insight: TradingInsight;
    try {
      insight = JSON.parse(content);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Raw content:', content);
      throw new Error('Failed to parse OpenAI response');
    }

    // Validate the response structure
    if (!insight.recommendation || 
        typeof insight.confidence !== 'number' || 
        !insight.reasoning ||
        !Array.isArray(insight.risks) ||
        !Array.isArray(insight.opportunities)) {
      console.error('Invalid insight format:', insight);
      throw new Error('Invalid insight format from OpenAI');
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