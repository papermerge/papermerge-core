from typing import List

from .schema import SelectOption, DateFormat


def get_date_formats() -> List[SelectOption]:
    """
    Get available date formats for UI selection.
    """
    # Mapping of enum values to human-readable labels
    labels = {
        DateFormat.ISO_8601: 'ISO 8601 (YYYY-MM-DD)',
        DateFormat.US_LONG: 'US Long (MM/DD/YYYY)',
        DateFormat.US_SHORT: 'US Short (MM/DD/YY)',
        DateFormat.US_LONG_TEXT: 'US Long Text (MMMM DD, YYYY)',
        DateFormat.US_SHORT_TEXT: 'US Short Text (MMM DD, YYYY)',
        DateFormat.EU_SLASH_LONG: 'European Slash Long (DD/MM/YYYY)',
        DateFormat.EU_SLASH_SHORT: 'European Slash Short (DD/MM/YY)',
        DateFormat.EU_DOT_LONG: 'European Dot Long (DD.MM.YYYY)',
        DateFormat.EU_DOT_SHORT: 'European Dot Short (DD.MM.YY)',
        DateFormat.EU_DASH_LONG: 'European Dash Long (DD-MM-YYYY)',
        DateFormat.ASIA_LONG: 'Asian Long (YYYY/MM/DD)',
        DateFormat.ASIA_DOT: 'Asian Dot (YYYY.MM.DD)',
        DateFormat.COMPACT_ISO: 'Compact ISO (YYYYMMDD)',
    }

    return [
        SelectOption(label=labels[fmt], value=fmt.value)
        for fmt in DateFormat
    ]
