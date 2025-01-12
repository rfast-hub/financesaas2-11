import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

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

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch current price from CoinGecko API
async function getCurrentPrice(cryptocurrency: string): Promise<number> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptocurrency}&vs_currencies=usd`
    );
    const data = await response.json();
    return data[cryptocurrency]?.usd || 0;
  } catch (error) {
    console.error(`Error fetching price for ${cryptocurrency}:`, error);
    throw new Error(`Failed to fetch price for ${cryptocurrency}`);
  }
}

// Send email alert using Resend
async function sendEmailAlert(email: string, alert: PriceAlert, currentPrice: number) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('Resend API key not configured');
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
        subject: `Price Alert: ${alert.cryptocurrency.toUpperCase()} ${alert.condition} ${alert.target_price}`,
        html: `
          <h2>Price Alert Triggered</h2>
          <p>Your price alert for ${alert.cryptocurrency.toUpperCase()} has been triggered.</p>
          <p>Current price: $${currentPrice}</p>
          <p>Target price: $${alert.target_price}</p>
          <p>Condition: ${alert.condition}</p>
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
function isAlertTriggered(alert: PriceAlert, currentPrice: number): boolean {
  switch (alert.alert_type) {
    case 'price':
      return alert.condition === 'above' 
        ? currentPrice >= (alert.target_price || 0)
        : currentPrice <= (alert.target_price || 0);
    
    case 'percentage':
      if (!alert.percentage_change) return false;
      // TODO: Implement percentage change logic
      return false;
    
    case 'volume':
      if (!alert.volume_threshold) return false;
      // TODO: Implement volume threshold logic
      return false;
    
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
    const currentPrice = await getCurrentPrice(alert.cryptocurrency);
    
    if (isAlertTriggered(alert, currentPrice)) {
      // Fetch user data for email notification
      const { data: userData, error: userError } = await supabase
        .auth.admin.getUserById(alert.user_id);

      if (userError) {
        console.error('Error fetching user data:', userError);
        return false;
      }

      // Send email notification if enabled
      if (alert.email_notification && userData?.user?.email) {
        await sendEmailAlert(userData.user.email, alert, currentPrice);
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