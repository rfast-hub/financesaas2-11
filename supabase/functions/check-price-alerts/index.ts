import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface PriceAlert {
  id: string;
  user_id: string;
  cryptocurrency: string;
  target_price: number;
  condition: string;
  email_notification: boolean;
}

async function getCurrentPrice(symbol: string): Promise<number> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`
  );
  const data = await response.json();
  return data[symbol.toLowerCase()].usd;
}

async function sendEmail(to: string, alert: PriceAlert, currentPrice: number) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Crypto Alert <onboarding@resend.dev>",
      to: [to],
      subject: `Price Alert: ${alert.cryptocurrency} has reached your target!`,
      html: `
        <h2>Price Alert Triggered</h2>
        <p>Your price alert for ${alert.cryptocurrency} has been triggered!</p>
        <p>Target Price: $${alert.target_price}</p>
        <p>Current Price: $${currentPrice}</p>
        <p>Condition: Price goes ${alert.condition} target</p>
      `,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to send email: ${await res.text()}`);
  }
}

Deno.serve(async () => {
  try {
    console.log("Checking price alerts...");
    
    // Get all active price alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)
      .is('triggered_at', null);

    if (alertsError) throw alertsError;

    for (const alert of (alerts as PriceAlert[])) {
      const currentPrice = await getCurrentPrice(alert.cryptocurrency);
      
      const isTriggered = 
        (alert.condition === 'above' && currentPrice >= alert.target_price) ||
        (alert.condition === 'below' && currentPrice <= alert.target_price);

      if (isTriggered) {
        console.log(`Alert triggered for ${alert.cryptocurrency}`);
        
        // Get user email
        const { data: userData, error: userError } = await supabase
          .auth.admin.getUserById(alert.user_id);

        if (userError) throw userError;

        if (alert.email_notification && userData?.user?.email) {
          await sendEmail(userData.user.email, alert, currentPrice);
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
      }
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing price alerts:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});