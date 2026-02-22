export interface MonitoringData {
  category: string; // Категория SPOT/Linear/...
  symbol: string; // Инструмент
  startPrice: number; // Цена в момент создания записи
  startDate: Date; // Дата создания записи
  targetPrice: number; // Ожидаемая цена
  targetDate?: Date; // Дата достижения ожидаемой цены
}
