enum NumberFormat {
  US = "us", // "US/UK (1,234.56)",
  EU_DOT = "eu_dot", //"European Dot (1.234,56)",
  EU_SPACE = "eu_space", //"European Space (1 234,56)",
  SWISS = "swiss", //"Swiss (1'234.56)",
  INDIAN = "indian", //"Indian (1,23,456.78)",
  COMPACT = "compact" //"Compact (1234.56)"
}

/**
 * Formats a number string according to the specified format using native Intl.NumberFormat
 * @param numStr - String representation of the number (e.g., "28.3", "5.03")
 * @param format - The desired number format as a string (e.g., 'US/UK (1,234.56)')
 * @param precision - Number of decimal places to display (e.g., 2 for monetary values)
 * @returns Formatted number string
 */
export default function formatNumber(
  numStr: string,
  format: string,
  precision?: number
): string {
  // Parse the number
  const num = parseFloat(numStr)

  // Handle invalid numbers
  if (isNaN(num)) {
    return numStr
  }

  // Determine the number of decimal places
  // If precision is provided, use it; otherwise use the original number's decimal places
  let decimalPlaces: number
  if (precision !== undefined) {
    decimalPlaces = precision
  } else {
    decimalPlaces = numStr.includes(".") ? numStr.split(".")[1]?.length || 0 : 0
  }

  let formatter: Intl.NumberFormat

  switch (format) {
    case NumberFormat.US:
    case "US/UK (1,234.56)":
      // US/UK format: 1,234.56
      formatter = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      })
      break

    case NumberFormat.EU_DOT:
    case "European Dot (1.234,56)":
      // European Dot format: 1.234,56 (German style)
      formatter = new Intl.NumberFormat("de-DE", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      })
      break

    case NumberFormat.EU_SPACE:
    case "European Space (1 234,56)":
      // European Space format: 1 234,56 (French style)
      formatter = new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      })
      break

    case NumberFormat.SWISS:
    case "Swiss (1'234.56)":
      // Swiss format: 1'234.56
      formatter = new Intl.NumberFormat("de-CH", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      })
      break

    case NumberFormat.INDIAN:
    case "Indian (1,23,456.78)":
      // Indian format: 1,23,456.78
      formatter = new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      })
      break

    case NumberFormat.COMPACT:
    case "Compact (1234.56)":
      // Compact format: 1234.56 (no grouping)
      formatter = new Intl.NumberFormat("en-US", {
        useGrouping: false,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces
      })
      break

    default:
      return numStr
  }

  return formatter.format(num)
}

/*
console.log('US Format (without precision):');
console.log(formatNumber('28.3', NumberFormat.US));        // 28.3
console.log(formatNumber('5.03', 'US/UK (1,234.56)'));     // 5.03
console.log(formatNumber('5.19', NumberFormat.US));        // 5.19

console.log('\nUS Format (with precision=2 for monetary values):');
console.log(formatNumber('28.3', 'US/UK (1,234.56)', 2));     // 28.30
console.log(formatNumber('5.03', 'US/UK (1,234.56)', 2));     // 5.03
console.log(formatNumber('5.19', NumberFormat.US, 2));        // 5.19
console.log(formatNumber('1234.5', NumberFormat.US, 2));      // 1,234.50
console.log(formatNumber('1234567.8', 'US/UK (1,234.56)', 2)); // 1,234,567.80

console.log('\nEuropean Dot Format (with precision=2):');
console.log(formatNumber('28.3', 'European Dot (1.234,56)', 2));    // 28,30
console.log(formatNumber('1234.5', NumberFormat.EU_DOT, 2)); // 1.234,50

console.log('\nEuropean Space Format (with precision=2):');
console.log(formatNumber('28.3', 'European Space (1 234,56)', 2));    // 28,30
console.log(formatNumber('1234.5', NumberFormat.EU_SPACE, 2)); // 1 234,50

console.log('\nSwiss Format (with precision=2):');
console.log(formatNumber('28.3', 'Swiss (1\'234.56)', 2));     // 28.30
console.log(formatNumber('1234.5', NumberFormat.SWISS, 2));  // 1'234.50

console.log('\nIndian Format (with precision=2):');
console.log(formatNumber('123456.7', 'Indian (1,23,456.78)', 2)); // 1,23,456.70
console.log(formatNumber('12345678.9', NumberFormat.INDIAN, 2)); // 1,23,45,678.90

console.log('\nCompact Format (with precision=2):');
console.log(formatNumber('1234.5', 'Compact (1234.56)', 2)); // 1234.50

console.log('\nNegative monetary values:');
console.log(formatNumber('-1234.5', 'US/UK (1,234.56)', 2));    // -1,234.50
console.log(formatNumber('-1234.5', 'European Dot (1.234,56)', 2)); // -1.234,50
*/
