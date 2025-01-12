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
    console.log('Fetching trading insights from OpenAI...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a cryptocurrency trading expert. Analyze the current market conditions and provide trading insights. Return ONLY a JSON object with the following structure, no markdown or additional text: { "recommendation": string, "confidence": number between 0-100, "reasoning": string, "risks": string[], "opportunities": string[] }.'
          },
          {
            role: 'user',
            content: 'Provide trading insights for Bitcoin and the overall crypto market.'
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Received response from OpenAI:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI');
    }

    // Clean the response content to ensure it's valid JSON
    const cleanContent = data.choices[0].message.content.trim();
    console.log('Cleaned content:', cleanContent);

    try {
      const insights = JSON.parse(cleanContent);
      console.log('Parsed insights:', insights);

      // Validate the response structure
      if (!insights.recommendation || !Array.isArray(insights.risks) || !Array.isArray(insights.opportunities)) {
        throw new Error('Invalid insights format');
      }

      return new Response(
        JSON.stringify(insights),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});