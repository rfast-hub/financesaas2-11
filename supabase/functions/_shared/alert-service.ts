import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { PriceAlert, CryptoData } from './types.ts';
import { isPriceAlertTriggered } from './price-comparison.ts';
import { isPercentageAlertTriggered } from './percentage-comparison.ts';
import { isVolumeAlertTriggered } from './volume-comparison.ts';

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

  switch (alert.alert_type) {
    case 'price':
      return isPriceAlertTriggered(alert, cryptoData);
    case 'percentage':
      return isPercentageAlertTriggered(alert, cryptoData);
    case 'volume':
      return isVolumeAlertTriggered(alert, cryptoData);
    default:
      console.log(`Unknown alert type: ${alert.alert_type}`);
      return false;
  }
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