import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {DOCUMENT_LANGUAGES} from "@/cconstants"
import {
  addRecentLanguage,
  selectRecentLanguagesSorted
} from "@/store/recentDocumentLangsSlice"
import type {ComboboxItem} from "@mantine/core"
import {Select} from "@mantine/core"
import {useMemo} from "react"
import {useTranslation} from "react-i18next"

interface Args {
  value: string | null
  disabled?: boolean
  label?: string
  onChange?: (value: string | null) => void
}

type SelectOptionType = ComboboxItem | {group: string; items: ComboboxItem[]}

export default function DocumentLangSelect({
  label,
  value,
  disabled = false,
  onChange
}: Args) {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const recentLanguages = useAppSelector(selectRecentLanguagesSorted)
  const selectOptions = useMemo(() => {
    // useMemo BEGIN / selectOptions
    const options: SelectOptionType[] = []
    const recentLanguageValues = new Set(recentLanguages.map(l => l.value))

    if (recentLanguageValues.size == 0) {
      options.push(...DOCUMENT_LANGUAGES)
      return options
    }

    options.push({
      group: t("recently_used", {
        defaultValue: "Recently Used"
      }),
      items: recentLanguages
    })

    const allButRecentLanguageItems = DOCUMENT_LANGUAGES.filter(
      l => !recentLanguageValues.has(l.value)
    )
    const allItems = allButRecentLanguageItems.map(l => ({
      value: l.value,
      label: l.label
    }))
    options.push({
      group: t("all_languages"),
      items: allItems
    })

    return options
    // useMemo END / selectOptions
  }, [recentLanguages, t])

  const handleChange = (newValue: string | null) => {
    if (newValue) {
      const foundItem = DOCUMENT_LANGUAGES.find(i => i.value == newValue)
      if (foundItem) {
        dispatch(addRecentLanguage(foundItem))
        onChange?.(newValue)
      }
    }
  }

  return (
    <Select
      label={
        label ?? t("documentLanguage", {defaultValue: "Document Language"})
      }
      data={selectOptions}
      value={value}
      placeholder={t("pickValue", {defaultValue: "Pick Value"})}
      onChange={handleChange}
      searchable
      disabled={disabled}
    />
  )
}
