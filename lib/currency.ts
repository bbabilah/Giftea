/**
 * Currency comes from the browser locale, with no setup.
 * Budget presets are scaled from rough USD-equivalent tiers so they feel
 * sensible in any currency (they're conversation starters, not quotes).
 */

const EURO = ["AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES"];

const REGION_CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", CA: "CAD", AU: "AUD", NZ: "NZD", IE: "EUR", GH: "GHS", NG: "NGN", KE: "KES", ZA: "ZAR",
  UG: "UGX", TZ: "TZS", RW: "RWF", ET: "ETB", EG: "EGP", MA: "MAD", SN: "XOF", CI: "XOF", CM: "XAF", ZM: "ZMW",
  ZW: "USD", BW: "BWP", IN: "INR", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", CN: "CNY", HK: "HKD", TW: "TWD",
  JP: "JPY", KR: "KRW", SG: "SGD", MY: "MYR", ID: "IDR", TH: "THB", VN: "VND", PH: "PHP", AE: "AED", SA: "SAR",
  QA: "QAR", KW: "KWD", IL: "ILS", TR: "TRY", CH: "CHF", NO: "NOK", SE: "SEK", DK: "DKK", PL: "PLN", CZ: "CZK",
  HU: "HUF", RO: "RON", BG: "BGN", UA: "UAH", RU: "RUB", BR: "BRL", MX: "MXN", AR: "ARS", CL: "CLP", CO: "COP",
  PE: "PEN", JM: "JMD", TT: "TTD", DO: "DOP", IS: "ISK",
};
for (const r of EURO) REGION_CURRENCY[r] = "EUR";

/** Approximate units per 1 USD, only for scaling budget presets. */
const PER_USD: Record<string, number> = {
  USD: 1, EUR: 0.9, GBP: 0.8, CAD: 1.4, AUD: 1.5, NZD: 1.7, GHS: 12, NGN: 1500, KES: 130, ZAR: 18, UGX: 3700,
  TZS: 2600, RWF: 1400, ETB: 130, EGP: 50, MAD: 10, XOF: 600, XAF: 600, ZMW: 27, BWP: 14, INR: 85, PKR: 280,
  BDT: 120, LKR: 300, NPR: 135, CNY: 7.2, HKD: 7.8, TWD: 32, JPY: 150, KRW: 1400, SGD: 1.35, MYR: 4.5, IDR: 16000,
  THB: 35, VND: 25000, PHP: 57, AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31, ILS: 3.7, TRY: 40, CHF: 0.88,
  NOK: 10.8, SEK: 10.5, DKK: 6.8, PLN: 4, CZK: 23, HUF: 360, RON: 4.6, BGN: 1.8, UAH: 41, RUB: 90, BRL: 5.5,
  MXN: 18, ARS: 1200, CLP: 950, COP: 4000, PEN: 3.7, JMD: 155, TTD: 6.8, DOP: 60, ISK: 138,
};

export interface LocaleInfo {
  locale: string;
  region: string;
  currency: string;
}

export function detectLocale(): LocaleInfo {
  const locale = (typeof navigator !== "undefined" && navigator.language) || "en-US";
  let region = "";
  try {
    region = new Intl.Locale(locale).maximize().region ?? "";
  } catch {
    region = locale.split("-")[1]?.toUpperCase() ?? "";
  }
  return { locale, region, currency: REGION_CURRENCY[region] ?? "USD" };
}

export function formatMoney(amount: number, info: LocaleInfo) {
  try {
    return new Intl.NumberFormat(info.locale, {
      style: "currency",
      currency: info.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${info.currency} ${Math.round(amount)}`;
  }
}

/** Round to a "nice" number: 1, 2, 2.5, 3, 5 × 10^n. */
function nice(n: number) {
  if (n <= 0) return 0;
  const pow = Math.pow(10, Math.floor(Math.log10(n)));
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  const m = n / pow;
  const step = steps.find((s) => m <= s) ?? 10;
  return step * pow;
}

export interface Budget {
  min: number;
  max: number | null; // null = no upper limit
}

const USD_TIERS: Array<[number, number | null]> = [
  [0, 20],
  [20, 50],
  [50, 100],
  [100, 250],
  [250, null],
];

export function budgetPresets(currency: string): Budget[] {
  const rate = PER_USD[currency] ?? 1;
  return USD_TIERS.map(([min, max]) => ({
    min: nice(min * rate),
    max: max === null ? null : nice(max * rate),
  }));
}

export function budgetLabel(b: Budget | null, info: LocaleInfo) {
  if (!b) return "Any budget";
  if (b.max === null) return `${formatMoney(b.min, info)}+`;
  if (b.min === 0) return `Under ${formatMoney(b.max, info)}`;
  return `${formatMoney(b.min, info)}–${formatMoney(b.max, info)}`;
}
