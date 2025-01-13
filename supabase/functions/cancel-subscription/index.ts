import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user?.email) {
      throw new Error("No email found");
    }

    // First check if there's an active subscription in our database
    const { data: subscriptionData, error: subscriptionError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (subscriptionError || !subscriptionData) {
      return new Response(
        JSON.stringify({ error: "No active subscription found in database" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return new Response(
        JSON.stringify({ error: "No Stripe customer found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Update our database to reflect that there's no active Stripe subscription
      await supabaseClient
        .from("subscriptions")
        .update({
          status: "inactive",
          is_active: false,
          canceled_at: new Date().toISOString(),
        })
        .eq("id", subscriptionData.id);

      return new Response(
        JSON.stringify({ error: "No active Stripe subscription found" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Cancel at period end to maintain access until the end of the billing period
    await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    // Update subscription status in Supabase
    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("id", subscriptionData.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ message: "Subscription cancelled successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in cancel-subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});