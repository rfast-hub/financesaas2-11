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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('COINAPI_API_KEY');
    if (!apiKey) {
      throw new Error('COINAPI_API_KEY is not set');
    }

    console.log('Fetching crypto data from CoinAPI...');

    // Fetch exchange rates for all symbols
    const ratesPromises = COIN_SYMBOLS.map(async (symbol) => {
      const response = await fetch(
        `https://rest.coinapi.io/v1/exchangerate/${symbol}/USD`,
        {
          headers: {
            'X-CoinAPI-Key': apiKey,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${symbol}: ${response.statusText}`);
      }
      
      return response.json();
    });

    const ratesData = await Promise.all(ratesPromises);

    // Fetch 24h OHLCV data for percentage changes
    const ohlcvPromises = COIN_SYMBOLS.map(async (symbol) => {
      const response = await fetch(
        `https://rest.coinapi.io/v1/ohlcv/${symbol}/USD/latest?period_id=1DAY`,
        {
          headers: {
            'X-CoinAPI-Key': apiKey,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch OHLCV data for ${symbol}: ${response.statusText}`);
      }
      
      return response.json();
    });

    const ohlcvData = await Promise.all(ohlcvPromises);

    // Format the data to match the expected structure
    const cryptoData: CryptoData[] = ratesData.map((rate, index) => {
      const symbol = COIN_SYMBOLS[index];
      const ohlcv = ohlcvData[index][0]; // Get the latest day's data
      const priceChange = ((rate.rate - ohlcv.price_open) / ohlcv.price_open) * 100;

      return {
        name: getCryptoName(symbol),
        symbol: symbol.toLowerCase(),
        current_price: rate.rate,
        price_change_percentage_24h: priceChange,
        total_volume: ohlcv.volume_traded,
        image: `${ICON_BASE_URL}/${symbol.toLowerCase()}.png`,
      };
    });

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