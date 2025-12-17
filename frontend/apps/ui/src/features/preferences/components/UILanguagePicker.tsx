import {useGetUILanguagesQuery} from "@/features/preferences/storage/api"
import {ComboboxItem, Select, SelectProps} from "@mantine/core"
import {TFunction} from "i18next"
import React from "react"

interface Args extends Omit<SelectProps, "data" | "onDropdownOpen"> {
  value: string
  onChange: (value: any, option: ComboboxItem) => void
  t?: TFunction
}

export const UILanguagePicker: React.FC<Args> = ({
  value,
  onChange,
  t,
  ...selectProps
}) => {
  const {data, isLoading, isError} = useGetUILanguagesQuery()

  return (
    <Select
      label={t?.("preferences.uiLanguage.label", {
        defaultValue: "Interface Language"
      })}
      description={t?.("preferences.uiLanguage.description", {
        defaultValue: "Language for the user interface"
      })}
      placeholder={t?.("pickValue")}
      value={value}
      onChange={onChange}
      data={data?.languages}
      searchable
      disabled={isLoading || isError}
      error={isError ? t?.("failedToLoad") : null}
      nothingFoundMessage={isLoading ? t?.("loading") : t?.("nothingFound")}
      maxDropdownHeight={300}
      comboboxProps={{shadow: "md"}}
      {...selectProps}
    />
  )
}

export default UILanguagePicker
