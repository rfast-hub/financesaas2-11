import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const fetchCryptoData = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('get-crypto-data', {
      body: { limit: 5 }
    });
    
    if (error) throw new Error(error.message);
    return data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    throw new Error('Failed to fetch cryptocurrency data. Please try again later.');
  }
};

const CryptoList = () => {
  const { data: cryptos, isLoading, error } = useQuery({
    queryKey: ['cryptos'],
    queryFn: fetchCryptoData,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
    meta: {
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  });

  if (isLoading) {
    return <div className="glass-card rounded-lg p-6 animate-pulse">Loading...</div>;
  }

  if (error) {
    return (
      <div className="glass-card rounded-lg p-6 text-warning">
        Failed to load cryptocurrency data. Please try again later.
      </div>
    );
  }

  return (
    <div className="glass-card rounded-lg p-6 animate-fade-in">
      <h2 className="text-xl font-semibold mb-6">Top Cryptocurrencies</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-muted-foreground">
              <th className="pb-4">Name</th>
              <th className="pb-4">Price</th>
              <th className="pb-4">24h Change</th>
              <th className="pb-4">Volume</th>
            </tr>
          </thead>
          <tbody>
            {cryptos?.map((crypto) => (
              <tr key={crypto.symbol} className="border-t border-secondary">
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">{crypto.symbol.toUpperCase()}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4">${crypto.current_price.toLocaleString()}</td>
                <td className="py-4">
                  <span
                    className={`flex items-center gap-1 ${
                      crypto.price_change_percentage_24h >= 0 ? "text-success" : "text-warning"
                    }`}
                  >
                    {crypto.price_change_percentage_24h >= 0 ? (
                      <ArrowUpIcon className="w-3 h-3" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3" />
                    )}
                    {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                  </span>
                </td>
                <td className="py-4">${(crypto.total_volume / 1e9).toFixed(1)}B</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CryptoList;