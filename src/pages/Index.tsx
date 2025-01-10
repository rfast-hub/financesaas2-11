import MarketStats from "@/components/MarketStats";
import CryptoChart from "@/components/CryptoChart";
import PortfolioCard from "@/components/PortfolioCard";
import CryptoList from "@/components/CryptoList";
import AIPredictions from "@/components/AIPredictions";
import SentimentAnalysis from "@/components/SentimentAnalysis";
import PriceAlerts from "@/components/PriceAlerts";
import { ChartLineUp, Wallet, Brain } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 page-title">
            Crypto Dashboard
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Track, analyze, and manage your cryptocurrency portfolio with real-time insights
          </p>
        </header>
        
        <MarketStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-2 text-xl font-semibold text-primary mb-4">
              <ChartLineUp className="w-6 h-6" />
              Market Overview
            </div>
            <CryptoChart />
          </div>
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-xl font-semibold text-primary mb-4">
              <Wallet className="w-6 h-6" />
              Portfolio
            </div>
            <PortfolioCard />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-8">
            <div className="flex items-center gap-2 text-xl font-semibold text-primary mb-4">
              <Brain className="w-6 h-6" />
              AI Insights
            </div>
            <SentimentAnalysis />
            <AIPredictions />
          </div>
          <div className="space-y-8">
            <PriceAlerts />
            <CryptoList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;