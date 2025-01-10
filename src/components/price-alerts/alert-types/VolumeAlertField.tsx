import { Input } from "@/components/ui/input";

interface VolumeAlertFieldProps {
  volume: string;
  onVolumeChange: (value: string) => void;
}

export const VolumeAlertField = ({
  volume,
  onVolumeChange,
}: VolumeAlertFieldProps) => {
  return (
    <Input
      type="number"
      placeholder="Volume threshold"
      value={volume}
      onChange={(e) => onVolumeChange(e.target.value)}
      className="w-[180px]"
    />
  );
};