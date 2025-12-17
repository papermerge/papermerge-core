import {DOCUMENT_LANGUAGES} from "@/cconstants"
import {ComboboxItem, Select, SelectProps} from "@mantine/core"
import {TFunction} from "i18next"
import React from "react"

interface Args extends Omit<SelectProps, "data" | "onDropdownOpen"> {
  value: string
  onChange: (value: any, option: ComboboxItem) => void
  t?: TFunction
}

export const DocumentDefaultLangPicker: React.FC<Args> = ({
  value,
  onChange,
  t,
  ...selectProps
}) => {
  return (
    <Select
      label={t?.("preferences.documentDefaultLang.label", {
        defaultValue: "Document Default Language"
      })}
      description={t?.("preferences.documentDefaultLang.description", {
        defaultValue:
          "If nothing else specified this will be set as document language"
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

export default DocumentDefaultLangPicker
