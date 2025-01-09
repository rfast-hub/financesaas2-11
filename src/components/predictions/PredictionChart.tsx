import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Prediction } from './types';

interface PredictionChartProps {
  predictions: Prediction[];
}

export const PredictionChart = ({ predictions }: PredictionChartProps) => {
  return (
    <div className="h-[300px] w-full mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={predictions}>
          <CartesianGrid strokeDasharray="3 3" stroke="#605F5B" />
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
            formatter={(value: number, name: string) => {
              switch(name) {
                case 'price':
                  return [`$${value.toLocaleString()}`, 'Predicted Price'];
                case 'support':
                  return [`$${value.toLocaleString()}`, 'Support Level'];
                case 'resistance':
                  return [`$${value.toLocaleString()}`, 'Resistance Level'];
                default:
                  return [value, name];
              }
            }}
          />
          <Line 
            type="monotone" 
            dataKey="resistance" 
            stroke="#FF6B6B" 
            strokeDasharray="5 5"
            dot={false}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#8989DE" 
            strokeWidth={2}
            dot={true}
          />
          <Line 
            type="monotone" 
            dataKey="support" 
            stroke="#4CAF50" 
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};