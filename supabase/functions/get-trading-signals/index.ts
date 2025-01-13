import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cryptocurrency, marketData } = await req.json();

    const prompt = `As a cryptocurrency trading expert, analyze this market data for ${cryptocurrency}:
    ${JSON.stringify(marketData)}
    
    Provide a detailed trading signal analysis in the following JSON format:
    {
      "signal": "buy" | "sell" | "hold",
      "confidence": number between 0 and 1,
      "timeframe": "short_term" | "medium_term" | "long_term",
      "reasoning": "detailed explanation",
      "keyLevels": {
        "support": number,
        "resistance": number
      },
      "riskLevel": "low" | "medium" | "high"
    }`;

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
            content: 'You are a cryptocurrency trading expert. Analyze market data and provide trading signals.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate trading signal');
    }

    const data = await response.json();
    const signal = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(signal), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-trading-signals:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});