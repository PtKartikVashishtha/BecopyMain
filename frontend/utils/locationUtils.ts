// utils/parseLocationText.ts

export interface ParsedLocation {
  city?: string;
  region?: string;
  countryCode?: string;
}

export const parseLocationText = (locationText: string | null | undefined): ParsedLocation | null => {
  if (!locationText) return null;

  // Common location patterns
  const patterns: RegExp[] = [
    /^(.+),\s*([A-Z]{2,3})$/i,            // "City, Country"
    /^(.+),\s*(.+),\s*([A-Z]{2,3})$/i,    // "City, State, Country"
  ];

  for (const pattern of patterns) {
    const match = locationText.match(pattern);
    if (match) {
      return {
        city: match[1]?.trim(),
        region: match.length === 4 ? match[2]?.trim() : undefined,
        countryCode: match[match.length - 1]?.trim().toUpperCase(),
      };
    }
  }

  return { city: locationText.trim() };
};
