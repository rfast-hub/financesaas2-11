import MarketStats from "@/components/MarketStats";
import CryptoChart from "@/components/CryptoChart";
import CryptoList from "@/components/CryptoList";
import AIPredictions from "@/components/AIPredictions";
import SentimentAnalysis from "@/components/SentimentAnalysis";
import PriceAlerts from "@/components/PriceAlerts";
import { AITradingInsights } from "@/components/ai/AITradingInsights";
import TradingSignals from "@/components/trading/TradingSignals";
import { ChartLine, Brain, LogOut, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { SubscriptionManager } from "@/components/subscription/SubscriptionManager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
          <div className="flex items-center gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Manage Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Subscription Management</DialogTitle>
                </DialogHeader>
                <SubscriptionManager />
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
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
            <AITradingInsights />
            <TradingSignals />
            <AIPredictions />
          </div>
          <div className="space-y-8">
            <PriceAlerts />
            <CryptoList />
          </div>
        </div>

        <footer className="text-center py-8 text-sm text-muted-foreground border-t border-muted/20">
          <div className="space-x-2">
            <a href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</a>
            <span>•</span>
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
          </div>
          <div className="mt-2">
            © {new Date().getFullYear()} CryptoTrack. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Index;