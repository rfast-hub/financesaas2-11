import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, Brain } from "lucide-react";
import { toast } from "sonner";

interface Prediction {
  price: number;
  timestamp: string;
  confidence: number;
}

const fetchPrediction = async (apiKey: string) => {
  try {
    // First, fetch recent Bitcoin data for context
    const historicalData = await fetch(
      "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily"
    );
    const data = await historicalData.json();
    
    // Format historical data for the AI
    const recentPrices = data.prices.map(([timestamp, price]: [number, number]) => ({
      date: new Date(timestamp).toISOString().split('T')[0],
      price: Math.round(price)
    }));

    // Prepare the prompt for the AI
    const prompt = `Given this Bitcoin price data for the last 30 days: ${JSON.stringify(recentPrices)}, analyze the trend and predict the likely price movement for the next 7 days. Consider technical indicators, market sentiment, and historical patterns. Provide a detailed analysis with price predictions for each day and confidence levels. Format your response as JSON with this structure: { "prediction": [{ "price": number, "timestamp": "YYYY-MM-DD", "confidence": number }], "analysis": "string" }`;

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
            content: 'You are a crypto market analysis AI. Provide detailed price predictions with technical analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
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
      analysis: parsedResponse.analysis
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
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Predicted Price']}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#8989DE" 
                  strokeWidth={2}
                  dot={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-2">Analysis Summary</h3>
              <p className="text-muted-foreground">{data.analysis}</p>
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