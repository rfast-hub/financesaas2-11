import { CryptoData } from './types.ts';

export async function getCryptoData(cryptocurrency: string): Promise<CryptoData> {
  try {
    console.log(`Fetching data for ${cryptocurrency} from CoinGecko...`);
    
    // Convert cryptocurrency to CoinGecko ID format (lowercase)
    const coinId = cryptocurrency.toLowerCase();
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
    );

    if (!response.ok) {
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch crypto data: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Raw CoinGecko response for ${cryptocurrency}:`, data);
    
    if (!data[coinId]) {
      console.error(`No data found for ${cryptocurrency} (ID: ${coinId})`);
      throw new Error(`No data found for ${cryptocurrency}`);
    }

    const result = {
      current_price: data[coinId].usd,
      price_change_percentage_24h: data[coinId].usd_24h_change || 0,
      total_volume: data[coinId].usd_24h_vol || 0,
    };

    console.log(`Processed data for ${cryptocurrency}:`, result);
    return result;
  } catch (error) {
    console.error(`Error fetching data for ${cryptocurrency}:`, error);
    throw error;
  }
}