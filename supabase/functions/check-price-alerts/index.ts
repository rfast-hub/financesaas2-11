import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceAlert {
  id: string;
  user_id: string;
  cryptocurrency: string;
  target_price: number | null;
  percentage_change: number | null;
  volume_threshold: number | null;
  condition: string;
  alert_type: string;
  email_notification: boolean;
}

async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    console.log(`Fetching price for ${symbol}`);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch price: ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!data[symbol.toLowerCase()]) {
      throw new Error(`No price data found for ${symbol}`);
    }
    
    console.log(`Current price for ${symbol}: $${data[symbol.toLowerCase()].usd}`);
    return data[symbol.toLowerCase()].usd;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    throw error;
  }
}

async function sendEmailAlert(userEmail: string, alert: PriceAlert, currentPrice: number) {
  try {
    console.log(`Sending email alert to ${userEmail}`);
    const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: [userEmail],
        subject: `Price Alert: ${alert.cryptocurrency} has reached your target!`,
        html: `
          <h2>Price Alert Triggered</h2>
          <p>Your ${alert.alert_type} alert for ${alert.cryptocurrency} has been triggered!</p>
          ${alert.target_price ? `<p>Target Price: $${alert.target_price}</p>` : ''}
          ${alert.percentage_change ? `<p>Target Percentage: ${alert.percentage_change}%</p>` : ''}
          ${alert.volume_threshold ? `<p>Volume Threshold: $${alert.volume_threshold}</p>` : ''}
          <p>Current Price: $${currentPrice}</p>
          <p>Condition: ${alert.condition}</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Failed to send email: ${await emailResponse.text()}`);
    }

    console.log(`Email alert sent successfully to ${userEmail}`);
  } catch (error) {
    console.error('Error sending email alert:', error);
    throw error;
  }
}

async function checkAlert(alert: PriceAlert): Promise<boolean> {
  try {
    const currentPrice = await getCurrentPrice(alert.cryptocurrency);
    
    switch (alert.alert_type) {
      case 'price':
        return alert.condition === 'above' 
          ? currentPrice >= (alert.target_price || 0)
          : currentPrice <= (alert.target_price || 0);
      
      case 'percentage':
        // Implement percentage change check
        return false; // TODO: Implement this
      
      case 'volume':
        // Implement volume threshold check
        return false; // TODO: Implement this
      
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking alert for ${alert.cryptocurrency}:`, error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting price alerts check...");
    
    // Get all active price alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)
      .is('triggered_at', null);

    if (alertsError) throw alertsError;
    console.log(`Found ${alerts?.length || 0} active alerts to check`);

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ status: 'success', message: 'No active alerts to check' }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const alert of alerts as PriceAlert[]) {
      console.log(`Checking alert ${alert.id} for ${alert.cryptocurrency}`);
      
      try {
        const isTriggered = await checkAlert(alert);

        if (isTriggered) {
          console.log(`Alert ${alert.id} triggered for ${alert.cryptocurrency}`);
          
          // Get user email
          const { data: userData, error: userError } = await supabase
            .auth.admin.getUserById(alert.user_id);

          if (userError) throw userError;

          if (alert.email_notification && userData?.user?.email) {
            await sendEmailAlert(userData.user.email, alert, await getCurrentPrice(alert.cryptocurrency));
          }

          // Update alert status
          const { error: updateError } = await supabase
            .from('price_alerts')
            .update({ 
              triggered_at: new Date().toISOString(),
              is_active: false 
            })
            .eq('id', alert.id);

          if (updateError) throw updateError;
          console.log(`Alert ${alert.id} marked as triggered`);
        }
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
        // Continue with next alert instead of failing the entire batch
        continue;
      }
    }

    return new Response(
      JSON.stringify({ status: 'success', message: 'Alerts checked successfully' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing price alerts:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});