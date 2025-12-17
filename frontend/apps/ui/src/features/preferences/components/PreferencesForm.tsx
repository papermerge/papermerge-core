import {Preferences} from "@/features/preferences/types"
import {ComboboxItem, Paper, Stack} from "@mantine/core"
import {TFunction} from "i18next"
import DateFormatPicker from "./DateFormatPicket"
import DocumentDefaultLangPicker from "./DocumentDefaultLangPicker"
import NumberFormatPicker from "./NumberFormatPicker"
import SearchLangPicker from "./SearchLangPicker"
import TimestampFormatPicker from "./TimestampFormatPicker"
import TimezonePicker from "./TimezonePicker"
import UILanguagePicker from "./UILanguagePicker"
import UIThemePicker from "./UIThemePicker"

interface Args {
  preferences: Preferences
  onChange?: (preferenceKey: keyof Preferences, option: ComboboxItem) => void
  t?: TFunction
  isLoading?: boolean
}

export default function PreferencesForm({
  preferences,
  onChange,
  t,
  isLoading = false
}: Args) {
  return (
    <Paper p="md" withBorder>
      <Stack>
        <UILanguagePicker
          value={preferences.ui_language}
          onChange={(_, option) => onChange?.("ui_language", option)}
          t={t}
        />

        <TimezonePicker
          value={preferences.timezone}
          onChange={(_, option) => onChange?.("timezone", option)}
          t={t}
        />

        <DateFormatPicker
          value={preferences.date_format}
          onChange={(_, option) => onChange?.("date_format", option)}
          t={t}
        />

        <TimestampFormatPicker
          value={preferences.timestamp_format}
          onChange={(_, option) => onChange?.("timestamp_format", option)}
          t={t}
        />

        <NumberFormatPicker
          value={preferences.number_format}
          onChange={(_, option) => onChange?.("number_format", option)}
          t={t}
        />

        <UIThemePicker
          value={preferences.ui_theme}
          onChange={(_, option) => onChange?.("ui_theme", option)}
          t={t}
        />

        <DocumentDefaultLangPicker
          value={preferences.document_default_lang}
          onChange={(_, option) => onChange?.("document_default_lang", option)}
          t={t}
        />

        <SearchLangPicker
          value={preferences.search_lang}
          onChange={(_, option) => onChange?.("search_lang", option)}
          t={t}
        />
      </Stack>
    </Paper>
  )
}
