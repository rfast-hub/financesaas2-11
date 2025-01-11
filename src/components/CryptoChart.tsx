import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";

const CryptoChart = () => {
  return (
    <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Bitcoin Price</h2>
      </div>
      <div className="h-[500px] w-full">
        <AdvancedRealTimeChart
          symbol="BINANCE:BTCUSDT"
          theme="dark"
          interval="D"
          timezone="Etc/UTC"
          style="1"
          locale="en"
          autosize
          hide_side_toolbar={false}
          allow_symbol_change={true}
          enable_publishing={false}
          hide_top_toolbar={false}
          container_id="tradingview_chart"
          toolbar_bg="#141413"
        />
      </div>
    </div>
  );
};

export default CryptoChart;