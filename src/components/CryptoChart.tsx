import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

const CryptoChart = () => {
  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden border border-border bg-card">
      <AdvancedRealTimeChart
        theme="dark"
        symbol="BINANCE:BTCUSDT"
        interval="D"
        timezone="Etc/UTC"
        style="1"
        locale="en"
        autosize
      />
    </div>
  );
};

export default CryptoChart;