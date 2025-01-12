import { CryptoData } from './types.ts';

export async function getCryptoData(cryptocurrency: string): Promise<CryptoData> {
  try {
    // Use CoinGecko's API for real-time price data
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptocurrency}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch crypto data: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data[cryptocurrency]) {
      throw new Error(`No data found for ${cryptocurrency}`);
    }

    return {
      current_price: data[cryptocurrency].usd,
      price_change_percentage_24h: data[cryptocurrency].usd_24h_change,
      total_volume: data[cryptocurrency].usd_24h_vol,
    };
  } catch (error) {
    console.error(`Error fetching data for ${cryptocurrency}:`, error);
    throw new Error(`Failed to fetch data for ${cryptocurrency}`);
  }
}