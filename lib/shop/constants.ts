export const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
] as const;

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

export const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04, AZ: 0.056, AR: 0.065, CA: 0.0725, CO: 0.029,
  CT: 0.0635, FL: 0.06, GA: 0.04, HI: 0.04, ID: 0.06,
  IL: 0.0625, IN: 0.07, IA: 0.06, KS: 0.065, KY: 0.06,
  LA: 0.0445, ME: 0.055, MD: 0.06, MA: 0.0625, MI: 0.06,
  MN: 0.06875, MS: 0.07, MO: 0.04225, NE: 0.055, NV: 0.0685,
  NJ: 0.06625, NM: 0.05125, NY: 0.08, NC: 0.0475, ND: 0.05,
  OH: 0.0575, OK: 0.045, PA: 0.06, RI: 0.07, SC: 0.06,
  SD: 0.045, TN: 0.07, TX: 0.0625, UT: 0.0485, VT: 0.06,
  VA: 0.053, WA: 0.065, WV: 0.06, WI: 0.05, WY: 0.04,
};

export const inputClasses =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm transition-colors";

export const errorInputClasses =
  "w-full px-3 py-2.5 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm transition-colors";

export const labelClasses = "block text-sm font-medium text-gray-700 mb-1.5";
