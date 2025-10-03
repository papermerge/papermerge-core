import {useGetTimestampFormatsQuery} from "@/features/preferences/storage/api"
import {ComboboxItem, Select, SelectProps} from "@mantine/core"
import {TFunction} from "i18next"
import React from "react"

interface TimestampFormatPickerProps
  extends Omit<SelectProps, "data" | "onDropdownOpen"> {
  value: string
  onChange: (value: any, option: ComboboxItem) => void
  t?: TFunction
}

export const TimestampFormatPicker: React.FC<TimestampFormatPickerProps> = ({
  value,
  onChange,
  t,
  ...selectProps
}) => {
  const {data, isLoading, isError} = useGetTimestampFormatsQuery()

  return (
    <Select
      label={t?.("preferences.timestampFormat.label", {
        defaultValue: "Timestamp Format"
      })}
      placeholder={t?.("pickValue")}
      value={value}
      onChange={onChange}
      data={data?.timestamp_formats}
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

export default TimestampFormatPicker
