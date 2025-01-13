import { Brain } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_CRYPTOCURRENCIES } from "../price-alerts/utils/constants";

interface TradingSignalHeaderProps {
  selectedCrypto: string;
  onCryptoChange: (value: string) => void;
}

export const TradingSignalHeader = ({ selectedCrypto, onCryptoChange }: TradingSignalHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5" />
        <h2 className="text-xl font-semibold">AI Trading Signals</h2>
      </div>
      <Select
        value={selectedCrypto}
        onValueChange={onCryptoChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select cryptocurrency" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CRYPTOCURRENCIES.map((crypto) => (
            <SelectItem key={crypto.id} value={crypto.id}>
              {crypto.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};