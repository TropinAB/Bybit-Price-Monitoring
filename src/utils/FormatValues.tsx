export function numberWithSpaces(value: number, digits: number = 0) {
  const parts: string[] = value
    .toFixed(digits || 14)
    .replace(".", ",")
    .split(",");
  if (parts[0]) parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (digits === 0 && parts[1]) parts[1] = parts[1].replace(/[,.]?0+$/, "");
  return parts.filter((part) => !!part).join(",");
}

export function formatPrice(price: number | null) {
  if (price === null) return "-";
  return price.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 12,
  });
}

export function formatVolume(volume: number | null) {
  if (volume === null) return "-";
  if (Math.abs(volume) >= 1_000_000)
    return `${numberWithSpaces(volume / 1_000_000, 3)}M`;
  if (Math.abs(volume) >= 1_000)
    return `${numberWithSpaces(volume / 1_000, 3)}K`;
  return numberWithSpaces(volume, 3);
}

export function formatPercentage(value: number | null) {
  if (value === null) return <p>-</p>;
  const className = value >= 0 ? "positive" : "negative";
  return <span className={className}>{numberWithSpaces(value * 100, 2)}%</span>;
}

// Форматирование даты
export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  if (typeof date === "string") date = new Date(date);
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
