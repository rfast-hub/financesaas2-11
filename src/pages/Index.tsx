import MarketStats from "@/components/MarketStats";
import CryptoChart from "@/components/CryptoChart";
import CryptoList from "@/components/CryptoList";
import AIPredictions from "@/components/AIPredictions";
import SentimentAnalysis from "@/components/SentimentAnalysis";
import PriceAlerts from "@/components/PriceAlerts";
import TradingSignals from "@/components/trading/TradingSignals";
import { ChartLine, Brain, LogOut, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = () => {
    window.open('https://billing.stripe.com/p/login/aEUeX67rfdiYeruaEE', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center mb-12 animate-fade-in">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 page-title">
              Crypto Dashboard
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Track, analyze, and manage your cryptocurrency portfolio with real-time insights
            </p>
          </div>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </header>
        
        <MarketStats />
        
        <div className="space-y-8">
          <div className="flex items-center gap-2 text-xl font-semibold text-primary mb-4">
            <ChartLine className="w-6 h-6" />
            Market Overview
          </div>
          <CryptoChart />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-xl font-semibold text-primary mb-4">
              <Brain className="w-6 h-6" />
              AI Insights
            </div>
            <SentimentAnalysis />
            <TradingSignals />
            <AIPredictions />
          </div>
          <div className="space-y-8">
            <PriceAlerts />
            <CryptoList />
          </div>
        </div>

        {/* Subscription Management Button */}
        <div className="flex justify-center pt-8 pb-4">
          <Button
            variant="secondary"
            className="flex items-center gap-2 px-6 py-3 text-lg"
            onClick={handleManageSubscription}
          >
            <CreditCard className="w-5 h-5" />
            Manage Subscription
          </Button>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-12 pt-8 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div>
              © {new Date().getFullYear()} Crypto Dashboard. All rights reserved.
            </div>
            <div className="flex gap-6">
              <a 
                href="http://landing.cryptotrack.org/terms" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-primary transition-colors"
              >
                Terms and Conditions
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Privacy Policy
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;