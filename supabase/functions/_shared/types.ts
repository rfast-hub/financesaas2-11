export interface PriceAlert {
  id: string;
  user_id: string;
  cryptocurrency: string;
  target_price: number | null;
  condition: string;
  email_notification: boolean;
  alert_type: 'price' | 'percentage' | 'volume';
  percentage_change?: number;
  volume_threshold?: number;
}

export interface CryptoData {
  current_price: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

export interface EmailRequest {
  from: string;
  to: string[];
  subject: string;
  html: string;
}