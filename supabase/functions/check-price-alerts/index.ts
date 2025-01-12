import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceAlert {
  id: string;
  user_id: string;
  cryptocurrency: string;
  target_price: number | null;
  condition: string;
  email_notification: boolean;
  alert_type: 'price' | 'percentage' | 'volume';
  percentage_change?: number;
  volume_threshold?: number;
}

interface CryptoData {
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch current crypto data from CoinGecko API
async function getCryptoData(cryptocurrency: string): Promise<CryptoData> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptocurrency}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
    );
    const data = await response.json();
    
    return {
      current_price: data[cryptocurrency]?.usd || 0,
      price_change_percentage_24h: data[cryptocurrency]?.usd_24h_change || 0,
      total_volume: data[cryptocurrency]?.usd_24h_vol || 0,
    };
  } catch (error) {
    console.error(`Error fetching data for ${cryptocurrency}:`, error);
    throw new Error(`Failed to fetch data for ${cryptocurrency}`);
  }
}

// Send email alert
async function sendEmailAlert(email: string, alert: PriceAlert, cryptoData: CryptoData) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Resend API key not configured');
    }

    let alertMessage = '';
    switch (alert.alert_type) {
      case 'price':
        alertMessage = `Current price: $${cryptoData.current_price}<br>Target price: $${alert.target_price}`;
        break;
      case 'percentage':
        alertMessage = `24h Price Change: ${cryptoData.price_change_percentage_24h.toFixed(2)}%<br>Target Change: ${alert.percentage_change}%`;
        break;
      case 'volume':
        alertMessage = `24h Volume: $${cryptoData.total_volume.toLocaleString()}<br>Volume Threshold: $${alert.volume_threshold?.toLocaleString()}`;
        break;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CryptoTrack <alerts@cryptotrack.com>',
        to: email,
        subject: `${alert.cryptocurrency.toUpperCase()} Alert Triggered`,
        html: `
          <h2>Crypto Alert Triggered</h2>
          <p>Your ${alert.alert_type} alert for ${alert.cryptocurrency.toUpperCase()} has been triggered.</p>
          <p>${alertMessage}</p>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email alert');
    }
  } catch (error) {
    console.error('Error sending email alert:', error);
    throw error;
  }
}

// Check if alert conditions are met
function isAlertTriggered(alert: PriceAlert, cryptoData: CryptoData): boolean {
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

// Fetch active alerts from database
async function fetchActiveAlerts() {
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

// Process a single alert
async function processAlert(alert: PriceAlert): Promise<boolean> {
  try {
    const cryptoData = await getCryptoData(alert.cryptocurrency);
    console.log(`Processing ${alert.alert_type} alert for ${alert.cryptocurrency}:`, {
      alert,
      cryptoData,
    });
    
    if (isAlertTriggered(alert, cryptoData)) {
      // Fetch user data for email notification
      const { data: userData, error: userError } = await supabase
        .auth.admin.getUserById(alert.user_id);

      if (userError) {
        console.error('Error fetching user data:', userError);
        return false;
      }

      // Send email notification if enabled
      if (alert.email_notification && userData?.user?.email) {
        await sendEmailAlert(userData.user.email, alert, cryptoData);
      }

      // Update alert status
      const { error: updateError } = await supabase
        .from('price_alerts')
        .update({
          triggered_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', alert.id);

      if (updateError) {
        console.error('Error updating alert:', updateError);
        return false;
      }

      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing alert ${alert.id}:`, error);
    return false;
  }
}

// Main handler function
Deno.serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
        status: 204
      });
    }

    console.log("Starting price alerts check...");
    
    const alerts = await fetchActiveAlerts();
    console.log(`Found ${alerts?.length || 0} active alerts to check`);

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({
          status: 'success',
          message: 'No active alerts to check'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const processedAlerts = [];
    
    // Process each alert
    for (const alert of alerts) {
      console.log(`Processing alert ${alert.id} for ${alert.cryptocurrency}`);
      const success = await processAlert(alert);
      if (success) {
        processedAlerts.push(alert.id);
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'Alerts checked successfully',
        processed: processedAlerts
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error processing price alerts:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        status: 'error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});