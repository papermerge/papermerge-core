import {DOCUMENT_LANGUAGES} from "@/cconstants"
import {ComboboxItem, Select, SelectProps} from "@mantine/core"
import {TFunction} from "i18next"
import React from "react"

interface Args extends Omit<SelectProps, "data" | "onDropdownOpen"> {
  value: string
  onChange: (value: any, option: ComboboxItem) => void
  t?: TFunction
}

export const SearchLangPicker: React.FC<Args> = ({
  value,
  onChange,
  t,
  ...selectProps
}) => {
  return (
    <Select
      label={t?.("preferences.searchLanguage.label", {
        defaultValue: "Search Language"
      })}
      description={t?.("preferences.searchLanguage.description", {
        defaultValue: "Default language used for full text searches"
      })}
      placeholder={t?.("pickValue")}
      value={value}
      onChange={onChange}
      data={DOCUMENT_LANGUAGES}
      searchable
      maxDropdownHeight={300}
      comboboxProps={{shadow: "md"}}
      {...selectProps}
    />
  )
}

export default SearchLangPicker
