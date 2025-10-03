from datetime import datetime
import logging
from typing import List

import pytz

from .schema import TimezoneOption

logger = logging.getLogger(__name__)

class TimezoneService:
    """Service for timezone-related operations"""

    # Popular timezones (most commonly used)
    POPULAR_TIMEZONES = [
        'UTC',
        # North America
        'America/New_York',      # US Eastern
        'America/Chicago',       # US Central
        'America/Denver',        # US Mountain
        'America/Los_Angeles',   # US Pacific
        'America/Toronto',       # Canada
        'America/Mexico_City',   # Mexico
        'America/Sao_Paulo',     # Brazil
        'America/Buenos_Aires',  # Argentina
        # Europe
        'Europe/London',         # UK
        'Europe/Paris',          # France
        'Europe/Berlin',         # Germany
        'Europe/Amsterdam',      # Netherlands
        'Europe/Brussels',       # Belgium
        'Europe/Zurich',         # Switzerland
        'Europe/Madrid',         # Spain
        'Europe/Rome',           # Italy
        'Europe/Vienna',         # Austria
        'Europe/Stockholm',      # Sweden
        'Europe/Oslo',           # Norway
        'Europe/Copenhagen',     # Denmark
        'Europe/Helsinki',       # Finland
        'Europe/Warsaw',         # Poland
        'Europe/Prague',         # Czech Republic
        'Europe/Moscow',         # Russia
        'Europe/Istanbul',       # Turkey
        # Asia
        'Asia/Dubai',            # UAE
        'Asia/Kolkata',          # India
        'Asia/Bangkok',          # Thailand
        'Asia/Singapore',        # Singapore
        'Asia/Hong_Kong',        # Hong Kong
        'Asia/Shanghai',         # China
        'Asia/Tokyo',            # Japan
        'Asia/Seoul',            # South Korea
        # Oceania
        'Australia/Sydney',      # Australia East
        'Australia/Melbourne',   # Australia
        'Australia/Perth',       # Australia West
        'Pacific/Auckland',      # New Zealand
        # Africa
        'Africa/Johannesburg',   # South Africa
        'Africa/Cairo',          # Egypt
        'Africa/Lagos',          # Nigeria
    ]

    @staticmethod
    def get_timezone_offset(timezone_name: str) -> str:
        """
        Get UTC offset for a timezone

        Args:
            timezone_name: IANA timezone name

        Returns:
            Formatted offset string (e.g., '+02:00', '-05:00')
        """
        try:
            timezone_obj = pytz.timezone(timezone_name)
            now = datetime.now(timezone_obj)
            offset = now.strftime('%z')
            # Format as +02:00 or -05:00
            return f"{offset[:3]}:{offset[3:]}"
        except Exception as e:
            logger.error(e)
            return ""

    @staticmethod
    def format_timezone_label(timezone_name: str, include_offset: bool = True) -> str:
        """
        Format timezone name for display

        Args:
            timezone_name: IANA timezone name
            include_offset: Whether to include UTC offset in label

        Returns:
            Formatted label
        """
        # Replace underscores with spaces
        display_name = timezone_name.replace('_', ' ')

        if include_offset:
            offset = TimezoneService.get_timezone_offset(timezone_name)
            if offset:
                return f"{display_name} (UTC{offset})"

        return display_name

    @staticmethod
    def get_timezone_region(timezone_name: str) -> str:
        """
        Extract region from timezone name

        Args:
            timezone_name: IANA timezone name

        Returns:
            Region name (e.g., 'America', 'Europe', 'Asia')
        """
        parts = timezone_name.split('/')
        return parts[0] if len(parts) > 1 else 'Other'

    @classmethod
    def get_timezones(cls) -> List[TimezoneOption]:
        """
        Get list of popular timezones

        Returns:
            List of commonly used timezones with offsets
        """
        result = []

        for tz in cls.POPULAR_TIMEZONES:
            try:
                offset = cls.get_timezone_offset(tz)
                label = cls.format_timezone_label(tz, include_offset=True)
                region = cls.get_timezone_region(tz)

                result.append(
                    TimezoneOption(
                        value=tz,
                        label=label,
                        region=region,
                    )
                )
            except Exception as e:
                # Skip invalid timezones
                logger.error(e)
                continue

        # Sort by region, then by timezone name
        result.sort(key=lambda x: (x.region, x.value))

        return result
