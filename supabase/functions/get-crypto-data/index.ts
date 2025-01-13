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

serve(async (req) => {
  console.log('Received request to get crypto data');

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders 
    });
  }

  try {
    const apiKey = Deno.env.get('COINGECKO_API_KEY');
    if (!apiKey) {
      console.error('CoinGecko API key not found');
      throw new Error('CoinGecko API key not configured');
    }

    const { limit } = await req.json();
    const cryptoSymbols = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple'].slice(0, limit || 5);
    
    console.log(`Fetching data for ${cryptoSymbols.length} cryptocurrencies:`, cryptoSymbols);
    
    const cryptoDataPromises = cryptoSymbols.map(async (symbol) => {
      try {
        const mappedSymbol = CRYPTO_SYMBOL_MAP[symbol.toLowerCase()] || symbol.toLowerCase();
        console.log(`Fetching data for ${mappedSymbol} from CoinGecko Pro API...`);
        
        const url = `https://pro-api.coingecko.com/api/v3/simple/price?ids=${mappedSymbol}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`;
        console.log('Request URL:', url);

        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'X-CG-Pro-API-Key': apiKey,
          }
        });
        
        if (!response.ok) {
          console.error(`CoinGecko API error for ${mappedSymbol}:`, {
            status: response.status,
            statusText: response.statusText,
          });
          const errorText = await response.text();
          console.error('Error response:', errorText);
          throw new Error(`CoinGecko API returned ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log(`Raw CoinGecko response for ${mappedSymbol}:`, data);

        if (!data[mappedSymbol]) {
          console.error(`No data found for ${mappedSymbol} in CoinGecko response`);
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