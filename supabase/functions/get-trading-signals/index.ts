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
    
    Generate a trading signal analysis in JSON format. Return ONLY the JSON object with no additional text.
    The JSON must follow this exact structure:
    {
      "signal": "buy" | "sell" | "hold",
      "confidence": <number between 0 and 1>,
      "timeframe": "short_term" | "medium_term" | "long_term",
      "reasoning": "<detailed explanation>",
      "keyLevels": {
        "support": <number>,
        "resistance": <number>
      },
      "riskLevel": "low" | "medium" | "high"
    }`;

    console.log('Sending request to OpenAI...');
    
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
            content: 'You are a cryptocurrency trading expert. You must respond with ONLY a JSON object, no additional text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    let signal;
    try {
      signal = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      console.log('Raw content:', data.choices[0].message.content);
      throw new Error('Failed to parse trading signal data');
    }

    // Validate the signal structure
    if (!signal.signal || !signal.confidence || !signal.timeframe || !signal.reasoning || !signal.keyLevels || !signal.riskLevel) {
      throw new Error('Invalid trading signal format');
    }

    return new Response(JSON.stringify(signal), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-trading-signals:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate trading signal',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});