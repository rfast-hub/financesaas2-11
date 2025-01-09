import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, Brain } from "lucide-react";
import { toast } from "sonner";

interface Prediction {
  price: number;
  timestamp: string;
  confidence: number;
  support: number;
  resistance: number;
}

const fetchPrediction = async (apiKey: string) => {
  try {
    // Fetch more historical data for better analysis
    const historicalData = await fetch(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=90&interval=daily"
    );
    const data = await historicalData.json();
    
    // Format historical data with more technical indicators
    const recentPrices = data.prices.map(([timestamp, price]: [number, number], index: number, array: any[]) => {
      // Calculate 7-day moving average
      const ma7 = index >= 6 
        ? array.slice(index - 6, index + 1).reduce((sum: number, [, p]: [number, number]) => sum + p, 0) / 7 
        : null;
      
      // Calculate 30-day moving average
      const ma30 = index >= 29 
        ? array.slice(index - 29, index + 1).reduce((sum: number, [, p]: [number, number]) => sum + p, 0) / 30 
        : null;

      return {
        date: new Date(timestamp).toISOString().split('T')[0],
        price: Math.round(price),
        ma7: ma7 ? Math.round(ma7) : null,
        ma30: ma30 ? Math.round(ma30) : null
      };
    });

    // Enhanced prompt for more precise predictions
    const prompt = `As a crypto market analysis AI, analyze this Bitcoin price data for the last 90 days, including 7-day and 30-day moving averages: ${JSON.stringify(recentPrices)}. 

    Please provide:
    1. A detailed technical analysis considering:
       - Moving average convergence/divergence
       - Support and resistance levels
       - Volume trends
       - Market sentiment
       - Historical patterns
       - Recent market events
    
    2. Price predictions for the next 7 days with:
       - Daily price targets
       - Support and resistance levels
       - Confidence levels based on technical indicators
       - Potential pivot points
    
    Format your response as JSON with this structure:
    {
      "prediction": [{
        "price": number,
        "timestamp": "YYYY-MM-DD",
        "confidence": number,
        "support": number,
        "resistance": number
      }],
      "analysis": "string",
      "keyIndicators": {
        "trend": "bullish|bearish|neutral",
        "strengthIndex": number,
        "volatilityScore": number
      }
    }`;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an expert crypto market analyst AI. Provide detailed technical analysis and precise price predictions based on multiple indicators.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Lower temperature for more focused predictions
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get prediction');
    }

    const result = await response.json();
    const parsedResponse = JSON.parse(result.choices[0].message.content);
    
    return {
      predictions: parsedResponse.prediction,
      analysis: parsedResponse.analysis,
      keyIndicators: parsedResponse.keyIndicators
    };
  } catch (error) {
    console.error('Error fetching prediction:', error);
    throw error;
  }
};

const AIPredictions = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('perplexityApiKey') || '');
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bitcoinPrediction', apiKey],
    queryFn: () => fetchPrediction(apiKey),
    enabled: false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('perplexityApiKey', apiKey);
    refetch();
  };

  const handleGeneratePrediction = () => {
    if (!apiKey) {
      toast.error("Please enter your Perplexity API key first");
      return;
    }
    refetch();
  };

  return (
    <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          <h2 className="text-xl font-semibold">AI Price Predictions</h2>
        </div>
        <Button onClick={handleGeneratePrediction} disabled={isLoading}>
          {isLoading ? "Analyzing..." : "Generate Prediction"}
        </Button>
      </div>

      {!apiKey && (
        <form onSubmit={handleApiKeySubmit} className="mb-4">
          <div className="flex gap-2">
            <input
              type="password"
              placeholder="Enter your Perplexity API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button type="submit">Save Key</Button>
          </div>
        </form>
      )}

      {data && (
        <>
          <div className="h-[300px] w-full mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#605F5B" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#E6E4DD"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#E6E4DD"
                  fontSize={12}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: '#3A3935',
                    border: '1px solid #605F5B',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#E6E4DD' }}
                  formatter={(value: number, name: string) => {
                    switch(name) {
                      case 'price':
                        return [`$${value.toLocaleString()}`, 'Predicted Price'];
                      case 'support':
                        return [`$${value.toLocaleString()}`, 'Support Level'];
                      case 'resistance':
                        return [`$${value.toLocaleString()}`, 'Resistance Level'];
                      default:
                        return [value, name];
                    }
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="resistance" 
                  stroke="#FF6B6B" 
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#8989DE" 
                  strokeWidth={2}
                  dot={true}
                />
                <Line 
                  type="monotone" 
                  dataKey="support" 
                  stroke="#4CAF50" 
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">Analysis Summary</h3>
              <p className="text-muted-foreground">{data.analysis}</p>
              {data.keyIndicators && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Trend</p>
                    <p className={`font-semibold ${
                      data.keyIndicators.trend === 'bullish' ? 'text-success' :
                      data.keyIndicators.trend === 'bearish' ? 'text-warning' :
                      'text-muted-foreground'
                    }`}>
                      {data.keyIndicators.trend.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Strength Index</p>
                    <p className="font-semibold">{data.keyIndicators.strengthIndex}/100</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Volatility</p>
                    <p className="font-semibold">{data.keyIndicators.volatilityScore}/100</p>
                  </div>
                </div>
              )}
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.predictions.map((pred: Prediction) => (
                <Card key={pred.timestamp} className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {new Date(pred.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-sm">
                      {pred.confidence.toFixed(1)}% confidence
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {pred.price > data.predictions[0].price ? (
                      <ArrowUpIcon className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowDownIcon className="w-4 h-4 text-warning" />
                    )}
                    <span className="text-lg font-semibold">
                      ${pred.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Support: ${pred.support.toLocaleString()}</span>
                      <span>Resistance: ${pred.resistance.toLocaleString()}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIPredictions;