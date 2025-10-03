import {useGetNumberFormatsQuery} from "@/features/preferences/storage/api"
import {ComboboxItem, Select, SelectProps} from "@mantine/core"
import {TFunction} from "i18next"
import React from "react"

interface NumberFormatPickerProps
  extends Omit<SelectProps, "data" | "onDropdownOpen"> {
  value: string
  onChange: (value: any, option: ComboboxItem) => void
  t?: TFunction
}

export const NumberFormatPicker: React.FC<NumberFormatPickerProps> = ({
  value,
  onChange,
  t,
  ...selectProps
}) => {
  const {data, isLoading, isError} = useGetNumberFormatsQuery()

  return (
    <Select
      label={t?.("preferences.numberFormat.label", {
        defaultValue: "Number Format"
      })}
      placeholder={t?.("pickValue")}
      value={value}
      onChange={onChange}
      data={data?.number_formats}
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

export default NumberFormatPicker
