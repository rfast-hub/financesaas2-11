import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CRYPTO_SYMBOL_MAP: { [key: string]: string } = {
  'bitcoin': 'bitcoin',
  'ethereum': 'ethereum',
  'binancecoin': 'binancecoin',
  'solana': 'solana',
  'ripple': 'ripple',
  'xrp': 'ripple',
  'cardano': 'cardano',
  'dogecoin': 'dogecoin',
  'polkadot': 'polkadot',
  'matic-network': 'matic-network',
};

async function fetchWithProAPI(symbol: string, apiKey: string) {
  const url = `https://pro-api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`;
  console.log('Attempting Pro API request:', url);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'X-Cg-Pro-Api-Key': apiKey,
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Pro API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Pro API failed: ${errorText}`);
  }
  
  return response.json();
}

async function fetchWithFreeAPI(symbol: string) {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`;
  console.log('Falling back to free API:', url);
  
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Free API Error:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`Free API failed: ${errorText}`);
  }
  
  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders 
    });
  }

  try {
    const apiKey = Deno.env.get('COINGECKO_API_KEY');
    console.log('API Key present:', !!apiKey);

    const { limit } = await req.json();
    const cryptoSymbols = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple'].slice(0, limit || 5);
    
    console.log(`Fetching data for ${cryptoSymbols.length} cryptocurrencies:`, cryptoSymbols);
    
    const cryptoDataPromises = cryptoSymbols.map(async (symbol) => {
      try {
        const mappedSymbol = CRYPTO_SYMBOL_MAP[symbol.toLowerCase()] || symbol.toLowerCase();
        
        let data;
        if (apiKey) {
          try {
            data = await fetchWithProAPI(mappedSymbol, apiKey);
          } catch (proError) {
            console.log(`Pro API failed for ${mappedSymbol}, falling back to free API`);
            data = await fetchWithFreeAPI(mappedSymbol);
          }
        } else {
          data = await fetchWithFreeAPI(mappedSymbol);
        }

        console.log(`Raw response for ${mappedSymbol}:`, data);

        if (!data[mappedSymbol]) {
          console.error(`No data found for ${mappedSymbol} in response`);
          throw new Error(`No data found for ${mappedSymbol}`);
        }

        return {
          name: getCryptoName(symbol),
          symbol: symbol,
          current_price: data[mappedSymbol].usd,
          price_change_percentage_24h: data[mappedSymbol].usd_24h_change || 0,
          total_volume: data[mappedSymbol].usd_24h_vol || 0,
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        return null;
      }
    });

    const results = (await Promise.all(cryptoDataPromises)).filter(result => result !== null);
    console.log('Successfully fetched crypto data:', results);

    if (results.length === 0) {
      throw new Error('Failed to fetch data for all cryptocurrencies');
    }

    return new Response(
      JSON.stringify(results),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in get-crypto-data function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch cryptocurrency data',
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

function getCryptoName(symbol: string): string {
  const names: { [key: string]: string } = {
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum',
    'binancecoin': 'Binance Coin',
    'solana': 'Solana',
    'ripple': 'XRP',
    'cardano': 'Cardano',
    'dogecoin': 'Dogecoin',
    'polkadot': 'Polkadot',
    'matic-network': 'Polygon',
  };
  return names[symbol.toLowerCase()] || symbol;
}