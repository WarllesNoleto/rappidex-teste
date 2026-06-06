import { StatusDelivery } from "../constants/enums.constants";
import { Report } from "../interfaces";

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

function isWithinRange(date: Date, range: DateRange) {
  const timestamp = date.getTime();
  return timestamp >= range.start.getTime() && timestamp <= range.end.getTime();
}

export function calculateDeliveryPerformance(
  reports: Report[],
  motoboyId: string,
  referenceDate = new Date(),
): DeliveryPerformancePeriods {
  const todayRange = getTodayRange(referenceDate);
  const weekRange = getTuesdayWeekRange(referenceDate);
  const performance: DeliveryPerformancePeriods = {
    today: { count: 0, total: 0 },
    week: { count: 0, total: 0 },
  };

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

    const deliveryValue = parseDeliveryValue(report.value);

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
