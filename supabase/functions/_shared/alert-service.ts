import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { PriceAlert, CryptoData } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export function isAlertTriggered(alert: PriceAlert, cryptoData: CryptoData): boolean {
  console.log(`Checking alert for ${alert.cryptocurrency}:`, {
    alert_type: alert.alert_type,
    condition: alert.condition,
    target_price: alert.target_price,
    current_price: cryptoData.current_price,
    percentage_change: alert.percentage_change,
    current_percentage: cryptoData.price_change_percentage_24h,
    volume_threshold: alert.volume_threshold,
    current_volume: cryptoData.total_volume,
  });

  // Convert prices to numbers and round to 2 decimal places for consistent comparison
  const currentPrice = Number(cryptoData.current_price.toFixed(2));
  const targetPrice = alert.target_price ? Number(alert.target_price.toFixed(2)) : null;

  switch (alert.alert_type) {
    case 'price':
      if (!targetPrice) return false;
      return alert.condition === 'above' 
        ? currentPrice >= targetPrice
        : currentPrice <= targetPrice;
    
    case 'percentage':
      if (!alert.percentage_change) return false;
      const currentPercentage = Number(cryptoData.price_change_percentage_24h.toFixed(2));
      const targetPercentage = Number(alert.percentage_change.toFixed(2));
      return alert.condition === 'above'
        ? currentPercentage >= targetPercentage
        : currentPercentage <= targetPercentage;
    
    case 'volume':
      if (!alert.volume_threshold) return false;
      const currentVolume = Math.floor(cryptoData.total_volume);
      const targetVolume = Math.floor(alert.volume_threshold);
      return currentVolume >= targetVolume;
    
    default:
      return false;
  }
}

export async function fetchActiveAlerts(): Promise<PriceAlert[]> {
  const { data: alerts, error: alertsError } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('is_active', true)
    .is('triggered_at', null);

  if (alertsError) {
    console.error('Error fetching alerts:', alertsError);
    throw alertsError;
  }

  return alerts;
}

export async function markAlertAsTriggered(alertId: string): Promise<void> {
  const { error: updateError } = await supabase
    .from('price_alerts')
    .update({
      triggered_at: new Date().toISOString(),
      is_active: false,
    })
    .eq('id', alertId);

  if (updateError) {
    console.error('Error updating alert:', updateError);
    throw updateError;
  }
}

export async function getUserEmail(userId: string): Promise<string | null> {
  const { data: userData, error: userError } = await supabase
    .auth.admin.getUserById(userId);

  if (userError) {
    console.error('Error fetching user data:', userError);
    throw userError;
  }

  return userData?.user?.email || null;
}