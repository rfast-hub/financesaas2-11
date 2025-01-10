import { Bell } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertForm } from "./price-alerts/AlertForm";
import { AlertList } from "./price-alerts/AlertList";

const PriceAlerts = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Price Alerts
        </CardTitle>
        <CardDescription>
          Get notified when cryptocurrencies hit your target price
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertForm />
        <div className="mt-6">
          <AlertList />
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceAlerts;