import { Input } from "@/components/ui/input";

interface PercentageAlertFieldProps {
  percentage: string;
  onPercentageChange: (value: string) => void;
}

export const PercentageAlertField = ({
  percentage,
  onPercentageChange,
}: PercentageAlertFieldProps) => {
  return (
    <Input
      type="number"
      placeholder="Percentage change"
      value={percentage}
      onChange={(e) => onPercentageChange(e.target.value)}
      className="w-[180px]"
    />
  );
};