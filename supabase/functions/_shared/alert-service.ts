import { createClient } from '@supabase/supabase-js';
import { PriceAlert, CryptoData } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

export function isAlertTriggered(alert: PriceAlert, cryptoData: CryptoData): boolean {
  switch (alert.alert_type) {
    case 'price':
      return alert.condition === 'above' 
        ? cryptoData.current_price >= (alert.target_price || 0)
        : cryptoData.current_price <= (alert.target_price || 0);
    
    case 'percentage':
      if (!alert.percentage_change) return false;
      return alert.condition === 'above'
        ? cryptoData.price_change_percentage_24h >= alert.percentage_change
        : cryptoData.price_change_percentage_24h <= alert.percentage_change;
    
    case 'volume':
      if (!alert.volume_threshold) return false;
      return cryptoData.total_volume >= alert.volume_threshold;
    
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

  return alerts as PriceAlert[];
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