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
  const currentPrice = Number(cryptoData.current_price);
  const targetPrice = alert.target_price ? Number(alert.target_price) : null;

  let isTriggered = false;
  
  switch (alert.alert_type) {
    case 'price':
      if (!targetPrice) {
        console.log('No target price set for price alert');
        return false;
      }
      isTriggered = alert.condition === 'above' 
        ? currentPrice >= targetPrice
        : currentPrice <= targetPrice;
      console.log(`Price comparison: ${currentPrice} ${alert.condition} ${targetPrice} = ${isTriggered}`);
      break;
    
    case 'percentage':
      if (!alert.percentage_change) {
        console.log('No percentage change set for percentage alert');
        return false;
      }
      const currentPercentage = Number(cryptoData.price_change_percentage_24h.toFixed(2));
      const targetPercentage = Number(alert.percentage_change.toFixed(2));
      isTriggered = alert.condition === 'above'
        ? currentPercentage >= targetPercentage
        : currentPercentage <= targetPercentage;
      console.log(`Percentage comparison: ${currentPercentage}% ${alert.condition} ${targetPercentage}% = ${isTriggered}`);
      break;
    
    case 'volume':
      if (!alert.volume_threshold) {
        console.log('No volume threshold set for volume alert');
        return false;
      }
      const currentVolume = Math.floor(cryptoData.total_volume);
      const targetVolume = Math.floor(alert.volume_threshold);
      isTriggered = currentVolume >= targetVolume;
      console.log(`Volume comparison: ${currentVolume} >= ${targetVolume} = ${isTriggered}`);
      break;
    
    default:
      console.log(`Unknown alert type: ${alert.alert_type}`);
      return false;
  }

  console.log(`Alert triggered: ${isTriggered}`);
  return isTriggered;
}

export async function fetchActiveAlerts(): Promise<PriceAlert[]> {
  console.log('Fetching active alerts...');
  
  const { data: alerts, error: alertsError } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('is_active', true)
    .is('triggered_at', null);

  if (alertsError) {
    console.error('Error fetching alerts:', alertsError);
    throw alertsError;
  }

  console.log(`Found ${alerts.length} active alerts:`, alerts);
  return alerts;
}

export async function markAlertAsTriggered(alertId: string): Promise<void> {
  console.log(`Marking alert ${alertId} as triggered...`);
  
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

  console.log(`Alert ${alertId} marked as triggered successfully`);
}

export async function getUserEmail(userId: string): Promise<string | null> {
  console.log(`Fetching email for user ${userId}...`);
  
  const { data: userData, error: userError } = await supabase
    .auth.admin.getUserById(userId);

  if (userError) {
    console.error('Error fetching user data:', userError);
    throw userError;
  }

  const email = userData?.user?.email || null;
  console.log(`Email for user ${userId}: ${email}`);
  return email;
}