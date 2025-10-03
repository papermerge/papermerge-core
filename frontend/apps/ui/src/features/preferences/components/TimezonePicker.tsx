import {useGetTimezonesQuery} from "@/features/preferences/storage/api"
import {ComboboxItem, Select, SelectProps} from "@mantine/core"
import {TFunction} from "i18next"
import React from "react"

interface TimezonePickerProps
  extends Omit<SelectProps, "data" | "onDropdownOpen"> {
  value: string
  t?: TFunction
  onChange: (value: any, option: ComboboxItem) => void
}

export const TimezonePicker: React.FC<TimezonePickerProps> = ({
  value,
  onChange,
  t,
  ...selectProps
}) => {
  const {data, isLoading, isError} = useGetTimezonesQuery()

  return (
    <Select
      label={t?.("preferences.timezone.label", {defaultValue: "Timezone"})}
      placeholder={t?.("pickValue")}
      description={t?.("preferences.timezone.description", {
        defaultValue: "All dates will be displayed according to your timezone"
      })}
      value={value}
      onChange={onChange}
      data={data?.timezones}
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

export default TimezonePicker
