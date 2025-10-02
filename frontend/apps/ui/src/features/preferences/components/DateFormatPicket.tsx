import {useGetDateFormatsQuery} from "@/features/preferences/storage/api"
import {ComboboxItem, Select, SelectProps} from "@mantine/core"
import {TFunction} from "i18next"
import React from "react"

interface DateFormatPickerProps
  extends Omit<SelectProps, "data" | "onDropdownOpen"> {
  value: string
  onChange: (value: any, option: ComboboxItem) => void
  t?: TFunction
}

export const DateFormatPicker: React.FC<DateFormatPickerProps> = ({
  value,
  onChange,
  t,
  ...selectProps
}) => {
  const {data, isLoading, isError} = useGetDateFormatsQuery()

  return (
    <Select
      label={t?.("preferences.dateFormat.label", {
        defaultValue: "Date Format"
      })}
      placeholder={t?.("pickValue")}
      value={value}
      onChange={onChange}
      data={data?.date_formats}
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

export default DateFormatPicker
