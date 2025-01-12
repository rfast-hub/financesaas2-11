import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CryptoData {
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
  image: string;
}

const COIN_SYMBOLS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
const ICON_BASE_URL = 'https://s3.eu-central-1.amazonaws.com/bbxt-static-icons/type-id/png_32';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('COINAPI_API_KEY');
    if (!apiKey) {
      throw new Error('COINAPI_API_KEY is not set');
    }

    console.log('Fetching crypto data from CoinAPI...');

    // Fetch exchange rates and 24h data in a single call for each symbol
    const cryptoPromises = COIN_SYMBOLS.map(async (symbol) => {
      try {
        // Get current rate
        const rateResponse = await fetch(
          `https://rest.coinapi.io/v1/exchangerate/${symbol}/USD`,
          {
            headers: {
              'X-CoinAPI-Key': apiKey,
            },
          }
        );
        
        if (!rateResponse.ok) {
          throw new Error(`Failed to fetch rate for ${symbol}: ${rateResponse.statusText}`);
        }
        
        const rateData = await rateResponse.json();
        
        // Get 24h historical data using time-series endpoint
        const timeEnd = new Date().toISOString();
        const timeStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const historyResponse = await fetch(
          `https://rest.coinapi.io/v1/exchangerate/${symbol}/USD/history?period_id=1HRS&time_start=${timeStart}&time_end=${timeEnd}`,
          {
            headers: {
              'X-CoinAPI-Key': apiKey,
            },
          }
        );

        if (!historyResponse.ok) {
          throw new Error(`Failed to fetch history for ${symbol}: ${historyResponse.statusText}`);
        }

        const historyData = await historyResponse.json();
        
        // Calculate 24h change and volume
        const oldPrice = historyData[0]?.rate_open || rateData.rate;
        const priceChange = ((rateData.rate - oldPrice) / oldPrice) * 100;
        
        // Estimate volume from available data
        const volume = historyData.reduce((acc: number, curr: any) => acc + (curr.volume || 0), 0);

        return {
          name: getCryptoName(symbol),
          symbol: symbol.toLowerCase(),
          current_price: rateData.rate,
          price_change_percentage_24h: priceChange,
          total_volume: volume,
          image: `${ICON_BASE_URL}/${symbol.toLowerCase()}.png`,
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error);
        throw error;
      }
    });

    const cryptoData = await Promise.all(cryptoPromises);

    return new Response(JSON.stringify(cryptoData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-crypto-data:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to fetch cryptocurrency data',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getCryptoName(symbol: string): string {
  const names: { [key: string]: string } = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'BNB': 'Binance Coin',
    'SOL': 'Solana',
    'XRP': 'XRP',
  };
  return names[symbol] || symbol;
}