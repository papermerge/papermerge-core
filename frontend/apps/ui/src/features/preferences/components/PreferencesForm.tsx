import {Preferences} from "@/features/preferences/types"
import {ComboboxItem, Paper, Select, Stack, Text} from "@mantine/core"
import {TFunction} from "i18next"

interface Args {
  preferences: Preferences
  onChange?: (_value: any, option: ComboboxItem) => void
  t?: TFunction
}

export default function PreferencesForm({preferences, onChange, t}: Args) {
  return (
    <Paper p="md">
      <Stack>
        <Text size="lg">
          {t?.("preferencesForm.preferences", {defaultValue: "Preferences"})}
        </Text>

        <Select
          label={t?.("preferencesForm.uiLanguage.label", {
            defaultValue: "Interface Language"
          })}
          description={t?.("preferencesForm.uiLanguage.description", {
            defaultValue: "Language for the user interface"
          })}
          data={UI_LANGUAGES}
          value={preferences.ui_language}
          onChange={onChange}
        />

        <Select
          label={t?.("preferencesForm.dateFormat.label", {
            defaultValue: "Date Format"
          })}
          data={DATE_FORMATS}
          value={preferences.date_format}
          onChange={onChange}
          w="fit-content"
          miw={300}
          comboboxProps={{width: "target"}}
          searchable
        />

        <Select
          label={t?.("preferencesForm.timestampFormat.label", {
            defaultValue: "Timestamp Format"
          })}
          data={TIMESTAMP_FORMATS}
          value={preferences.timestamp_format}
          onChange={onChange}
          w="fit-content"
          miw={300}
          comboboxProps={{width: "target"}}
          searchable
        />

        <Select
          label={t?.("preferencesForm.numberFormat.label", {
            defaultValue: "Number Format"
          })}
          data={NUMBER_FORMATS}
          value={preferences.number_format}
          onChange={onChange}
          w="fit-content"
          miw={300}
          comboboxProps={{width: "target"}}
          searchable
        />
      </Stack>
    </Paper>
  )
}

const UI_LANGUAGES: ComboboxItem[] = [
  {value: "en", label: "English"},
  {value: "de", label: "Deutsch"}
]

const DATE_FORMATS: ComboboxItem[] = [
  // ISO Standard
  {value: "YYYY-MM-DD", label: "ISO 8601 (YYYY-MM-DD)"},

  // US Formats
  {value: "MM/DD/YYYY", label: "US Long (MM/DD/YYYY)"},
  {value: "MM/DD/YY", label: "US Short (MM/DD/YY)"},
  {value: "MMMM DD, YYYY", label: "US Long Text (MMMM DD, YYYY)"},
  {value: "MMM DD, YYYY", label: "US Short Text (MMM DD, YYYY)"},

  // European Formats (slash separator)
  {value: "DD/MM/YYYY", label: "European Slash Long (DD/MM/YYYY)"},
  {value: "DD/MM/YY", label: "European Slash Short (DD/MM/YY)"},

  // European Formats (dot separator)
  {value: "DD.MM.YYYY", label: "European Dot Long (DD.MM.YYYY)"},
  {value: "DD.MM.YY", label: "European Dot Short (DD.MM.YY)"},

  // European Formats (dash separator)
  {value: "DD-MM-YYYY", label: "European Dash Long (DD-MM-YYYY)"},

  // Asian Formats
  {value: "YYYY/MM/DD", label: "Asian Long (YYYY/MM/DD)"},
  {value: "YYYY.MM.DD", label: "Asian Dot (YYYY.MM.DD)"},

  // Compact formats (no separators)
  {value: "YYYYMMDD", label: "Compact ISO (YYYYMMDD)"}
]
export const TIMESTAMP_FORMATS: ComboboxItem[] = [
  // ISO 8601 Formats
  {value: "YYYY-MM-DD HH:mm:ss", label: "ISO 8601 (2025-09-30 14:35:42)"},
  {
    value: "YYYY-MM-DD HH:mm:ss Z",
    label: "ISO 8601 with TZ (2025-09-30 14:35:42 +02:00)"
  },
  {
    value: "YYYY-MM-DDTHH:mm:ss",
    label: "ISO 8601 T-format (2025-09-30T14:35:42)"
  },
  {
    value: "YYYY-MM-DDTHH:mm:ssZ",
    label: "ISO 8601 T with TZ (2025-09-30T14:35:42+02:00)"
  },

  // US Formats (12-hour)
  {
    value: "MM/DD/YYYY hh:mm:ss A",
    label: "US 12h Long (09/30/2025 02:35:42 PM)"
  },
  {value: "MM/DD/YY hh:mm A", label: "US 12h Short (09/30/25 02:35 PM)"},
  {value: "MMM DD, YYYY hh:mm A", label: "US 12h Text (Sep 30, 2025 02:35 PM)"},
  {
    value: "MMMM DD, YYYY hh:mm:ss A",
    label: "US 12h Text Long (September 30, 2025 02:35:42 PM)"
  },

  // US Formats (24-hour)
  {value: "MM/DD/YYYY HH:mm:ss", label: "US 24h Long (09/30/2025 14:35:42)"},
  {value: "MM/DD/YY HH:mm", label: "US 24h Short (09/30/25 14:35)"},
  {value: "MMM DD, YYYY HH:mm", label: "US 24h Text (Sep 30, 2025 14:35)"},
  {
    value: "MMMM DD, YYYY HH:mm:ss",
    label: "US 24h Text Long (September 30, 2025 14:35:42)"
  },

  // European Formats
  {value: "DD/MM/YYYY HH:mm:ss", label: "European Slash (30/09/2025 14:35:42)"},
  {value: "DD/MM/YY HH:mm", label: "European Slash Short (30/09/25 14:35)"},
  {value: "DD.MM.YYYY HH:mm:ss", label: "European Dot (30.09.2025 14:35:42)"},
  {value: "DD.MM.YYYY HH:mm", label: "European Dot Short (30.09.2025 14:35)"},
  {value: "DD-MM-YYYY HH:mm:ss", label: "European Dash (30-09-2025 14:35:42)"},

  // Asian Formats
  {value: "YYYY/MM/DD HH:mm:ss", label: "Asian Long (2025/09/30 14:35:42)"},
  {value: "YYYY/MM/DD HH:mm", label: "Asian Short (2025/09/30 14:35)"},

  // Compact
  {value: "YYYYMMDDHHmmss", label: "Compact (20250930143542)"}
]

export const NUMBER_FORMATS: ComboboxItem[] = [
  {value: "us", label: "US/UK (1,234.56)"},
  {value: "eu_dot", label: "European Dot (1.234,56)"},
  {value: "eu_space", label: "European Space (1 234,56)"},
  {value: "swiss", label: "Swiss (1'234.56)"},
  {value: "compact", label: "Compact (1234.56)"}
]
