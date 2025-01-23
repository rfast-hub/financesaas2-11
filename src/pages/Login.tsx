import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        try {
          // Check subscription status
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single();

          if (subscriptionError) {
            throw subscriptionError;
          }

          if (!subscriptionData) {
            toast({
              title: "Subscription Required",
              description: "Please subscribe to access the dashboard",
              variant: "destructive",
            });
            await supabase.auth.signOut();
            return;
          }

          // Check if subscription is expired
          if (subscriptionData.current_period_end && new Date(subscriptionData.current_period_end) < new Date()) {
            toast({
              title: "Subscription Expired",
              description: "Your subscription has expired. Please renew to continue.",
              variant: "destructive",
            });
            await supabase.auth.signOut();
            return;
          }

          // If all checks pass, navigate to dashboard
          navigate("/dashboard");
        } catch (error) {
          console.error("Error checking subscription:", error);
          toast({
            title: "Error",
            description: "There was an error checking your subscription status",
            variant: "destructive",
          });
          await supabase.auth.signOut();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to access your crypto dashboard</p>
        </div>
        
        <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                  },
                },
              },
            }}
            providers={[]}
            view="sign_in"
            showLinks={false}
          />
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>A valid subscription is required to access the dashboard.</p>
          <a 
            href="https://billing.stripe.com/p/login/aEUeX67rfdiYeruaEE" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Subscribe Now
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;