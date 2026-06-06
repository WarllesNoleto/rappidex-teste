import { StatusDelivery } from "../constants/enums.constants";
import type { City, Report } from "../interfaces";

export type DeliveryPerformance = {
  count: number;
  total: number;
};

export type DeliveryPerformancePeriods = {
  today: DeliveryPerformance;
  week: DeliveryPerformance;
};

type DateRange = {
  start: Date;
  end: Date;
};

export function getTodayRange(referenceDate = new Date()): DateRange {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(referenceDate);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function getTuesdayWeekRange(referenceDate = new Date()): DateRange {
  const start = new Date(referenceDate);
  const daysSinceTuesday = (start.getDay() - 2 + 7) % 7;
  start.setDate(start.getDate() - daysSinceTuesday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function isWithinRange(date: Date, range: DateRange) {
  const timestamp = date.getTime();
  return timestamp >= range.start.getTime() && timestamp <= range.end.getTime();
}

export function parseDeliveryValue(value?: string | number | null): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalizedValue = String(value ?? "")
    .trim()
    .replace(/R\$/gi, "")
    .replace(/\s/g, "");

  if (!normalizedValue) return 0;

  const decimalValue = normalizedValue.includes(",")
    ? normalizedValue.replace(/\./g, "").replace(",", ".")
    : normalizedValue;
  const parsedValue = Number(decimalValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getCityDeliveryValue(
  report: Report,
  deliveryValueByCityId: Map<string, number>,
) {
  const cityId = String(
    report.cityId ?? report.establishmentCityId ?? "",
  ).trim();
  if (!cityId) return 0;

  return deliveryValueByCityId.get(cityId) ?? 0;
}

export function calculateDeliveryPerformance(
  reports: Report[],
  motoboyId: string,
  cities: City[],
  referenceDate = new Date(),
): DeliveryPerformancePeriods {
  const todayRange = getTodayRange(referenceDate);
  const weekRange = getTuesdayWeekRange(referenceDate);
  const deliveryValueByCityId = new Map<string, number>();
  const performance: DeliveryPerformancePeriods = {
    today: { count: 0, total: 0 },
    week: { count: 0, total: 0 },
  };

  cities.forEach((city) => {
    const cityId = String(city.id ?? "").trim();
    const deliveryValue = parseDeliveryValue(city.deliveryValue);

    if (cityId) {
      deliveryValueByCityId.set(cityId, deliveryValue);
    }
  });

  reports.forEach((report) => {
    if (
      report.status !== StatusDelivery.FINISHED ||
      report.motoboyId !== motoboyId ||
      !report.finishedAt
    ) {
      return;
    }

    const finishedAt = new Date(report.finishedAt);
    if (Number.isNaN(finishedAt.getTime())) return;

    const deliveryValue = getCityDeliveryValue(report, deliveryValueByCityId);

    if (isWithinRange(finishedAt, weekRange)) {
      performance.week.count += 1;
      performance.week.total += deliveryValue;
    }

    if (isWithinRange(finishedAt, todayRange)) {
      performance.today.count += 1;
      performance.today.total += deliveryValue;
    }
  });

  return performance;
}
