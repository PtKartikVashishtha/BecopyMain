// backend/utils/locationUtils.js

const countryCodeMap = {
  'india': 'IN',
  'united states': 'US',
  'usa': 'US',
  'america': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'england': 'GB',
  'canada': 'CA',
  'australia': 'AU',
  'germany': 'DE',
  'france': 'FR',
  'japan': 'JP',
  'china': 'CN',
  'brazil': 'BR',
  'singapore': 'SG',
  'netherlands': 'NL',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
};

const parseLocationText = (locationText) => {
  if (!locationText || typeof locationText !== 'string') {
    return null;
  }

  const normalized = locationText.toLowerCase().trim();
  
  // Common patterns: "City, State", "City, Country", "State, Country"
  const parts = normalized.split(',').map(part => part.trim());
  
  let result = {
    city: null,
    region: null,
    countryCode: null,
  };

  if (parts.length === 1) {
    // Single location - could be city, state, or country
    const location = parts[0];
    
    // Check if it's a known country
    const countryCode = countryCodeMap[location];
    if (countryCode) {
      result.countryCode = countryCode;
    } else {
      // Assume it's a city
      result.city = location;
    }
  } else if (parts.length === 2) {
    // Two parts: likely "City, State/Country"
    const [first, second] = parts;
    
    // Check if second part is a known country
    const countryCode = countryCodeMap[second];
    if (countryCode) {
      result.city = first;
      result.countryCode = countryCode;
    } else {
      // Assume first is city, second is state/region
      result.city = first;
      result.region = second;
    }
  } else if (parts.length >= 3) {
    // Three or more parts: likely "City, State, Country"
    const [first, second, ...rest] = parts;
    const lastPart = rest[rest.length - 1] || second;
    
    result.city = first;
    result.region = second;
    
    const countryCode = countryCodeMap[lastPart];
    if (countryCode) {
      result.countryCode = countryCode;
    }
  }

  // Clean up results
  Object.keys(result).forEach(key => {
    if (result[key]) {
      result[key] = result[key].charAt(0).toUpperCase() + result[key].slice(1);
    }
  });

  return result;
};

module.exports = {
  parseLocationText,
  countryCodeMap,
};