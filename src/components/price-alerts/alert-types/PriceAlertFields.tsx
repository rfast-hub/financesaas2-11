import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PriceAlertFieldsProps {
  targetPrice: string;
  condition: string;
  onTargetPriceChange: (value: string) => void;
  onConditionChange: (value: string) => void;
}

export const PriceAlertFields = ({
  targetPrice,
  condition,
  onTargetPriceChange,
  onConditionChange,
}: PriceAlertFieldsProps) => {
  return (
    <>
      <Select value={condition} onValueChange={onConditionChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select condition" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="above">Price goes above</SelectItem>
          <SelectItem value="below">Price goes below</SelectItem>
        </SelectContent>
      </Select>

      <Input
        type="number"
        placeholder="Target price"
        value={targetPrice}
        onChange={(e) => onTargetPriceChange(e.target.value)}
        className="w-[180px]"
      />
    </>
  );
};