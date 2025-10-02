from typing import List

from .schema import SelectOption, NumberFormat


def get_number_formats() -> List[SelectOption]:
    """
    Get available number formats for UI selection.
    """
    labels = {
        NumberFormat.US: 'US/UK (1,234.56)',
        NumberFormat.EU_DOT: 'European Dot (1.234,56)',
        NumberFormat.EU_SPACE: 'European Space (1 234,56)',
        NumberFormat.SWISS: 'Swiss (1\'234.56)',
        NumberFormat.INDIAN: 'Indian (1,23,456.78)',
        NumberFormat.COMPACT: 'Compact (1234.56)',
    }

    return [
        SelectOption(label=labels[fmt], value=fmt.value)
        for fmt in NumberFormat
    ]
