import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { TradingSignalHeader } from "./TradingSignalHeader";
import { TradingSignalContent } from "./TradingSignalContent";
import { TradingSignal } from "./types";

const TradingSignals = () => {
  const [selectedCrypto, setSelectedCrypto] = useState("bitcoin");

  const { data: signal, isLoading, error } = useQuery({
    queryKey: ['tradingSignals', selectedCrypto],
    queryFn: async () => {
      // First get current market data
      const { data: marketData, error: marketError } = await supabase.functions.invoke('get-crypto-data');
      if (marketError) throw marketError;

      // Then get trading signals based on market data
      const { data: signalData, error: signalError } = await supabase.functions.invoke<TradingSignal>('get-trading-signals', {
        body: { 
          cryptocurrency: selectedCrypto,
          marketData 
        }
      });
      
      if (signalError) throw signalError;
      return signalData;
    },
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          <p>Failed to load trading signals</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <TradingSignalHeader 
        selectedCrypto={selectedCrypto}
        onCryptoChange={setSelectedCrypto}
      />
      {signal && <TradingSignalContent signal={signal} />}
    </Card>
  );
};

export default TradingSignals;