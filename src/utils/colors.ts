export const BRAND_COLORS = {
  green: "#58cc02",
  greenDark: "#4ca300",
  blue: "#1cb0f6",
  blueDark: "#1899d6",
  gold: "#ffc800",
  goldDark: "#e0a800",
  red: "#ff4b4b",
};

/**
 * Resolves a CSS variable string like "var(--color-brand-blue)"
 * into its hex value for canvas-based libraries like Chart.js.
 */
export function resolveBrandColor(varName: string): string {
  const cleanName = varName.replace("var(--", "").replace(")", "");
  
  switch (cleanName) {
    case "color-brand-green": return BRAND_COLORS.green;
    case "color-brand-blue": return BRAND_COLORS.blue;
    case "color-brand-gold": return BRAND_COLORS.gold;
    case "color-brand-red": return BRAND_COLORS.red;
    case "color-brand-green-dark": return BRAND_COLORS.greenDark;
    case "color-brand-blue-dark": return BRAND_COLORS.blueDark;
    case "color-brand-gold-dark": return BRAND_COLORS.goldDark;
    default: return varName; // Return as-is if not matched
  }
}
