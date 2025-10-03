from typing import List

from .schema import SelectOption, TimestampFormat


def get_timestamp_formats() -> List[SelectOption]:
    """
    Get available timestamp formats for UI selection.
    """
    labels = {
        TimestampFormat.ISO_8601_FULL: 'ISO 8601 Full (YYYY-MM-DD HH:mm:ss)',
        TimestampFormat.ISO_8601_WITH_TZ: 'ISO 8601 with TZ (YYYY-MM-DD HH:mm:ss Z)',
        TimestampFormat.ISO_8601_T: 'ISO 8601 T (YYYY-MM-DDTHH:mm:ss)',
        TimestampFormat.ISO_8601_T_TZ: 'ISO 8601 T with TZ (YYYY-MM-DDTHH:mm:ssZ)',
        TimestampFormat.US_LONG_12H: 'US Long 12H (MM/DD/YYYY hh:mm:ss A)',
        TimestampFormat.US_SHORT_12H: 'US Short 12H (MM/DD/YY hh:mm A)',
        TimestampFormat.US_TEXT_12H: 'US Text 12H (MMM DD, YYYY hh:mm A)',
        TimestampFormat.US_TEXT_LONG_12H: 'US Text Long 12H (MMMM DD, YYYY hh:mm:ss A)',
        TimestampFormat.US_LONG_24H: 'US Long 24H (MM/DD/YYYY HH:mm:ss)',
        TimestampFormat.US_SHORT_24H: 'US Short 24H (MM/DD/YY HH:mm)',
        TimestampFormat.US_TEXT_24H: 'US Text 24H (MMM DD, YYYY HH:mm)',
        TimestampFormat.US_TEXT_LONG_24H: 'US Text Long 24H (MMMM DD, YYYY HH:mm:ss)',
        TimestampFormat.EU_SLASH_24H: 'European Slash 24H (DD/MM/YYYY HH:mm:ss)',
        TimestampFormat.EU_SLASH_SHORT: 'European Slash Short (DD/MM/YY HH:mm)',
        TimestampFormat.EU_DOT_24H: 'European Dot 24H (DD.MM.YYYY HH:mm:ss)',
        TimestampFormat.EU_DOT_SHORT: 'European Dot Short (DD.MM.YYYY HH:mm)',
        TimestampFormat.EU_DASH_24H: 'European Dash 24H (DD-MM-YYYY HH:mm:ss)',
        TimestampFormat.ASIA_LONG: 'Asian Long (YYYY/MM/DD HH:mm:ss)',
        TimestampFormat.ASIA_SHORT: 'Asian Short (YYYY/MM/DD HH:mm)',
        TimestampFormat.COMPACT: 'Compact (YYYYMMDDHHmmss)',
    }

    return [
        SelectOption(label=labels[fmt], value=fmt.value)
        for fmt in TimestampFormat
    ]
