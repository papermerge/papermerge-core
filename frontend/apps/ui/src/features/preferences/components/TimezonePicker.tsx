import {useLazyGetTimezonesQuery} from "@/features/preferences/storage/api"
import {ComboboxItem, Select, SelectProps} from "@mantine/core"
import React from "react"

interface TimezonePickerProps
  extends Omit<SelectProps, "data" | "onDropdownOpen"> {
  value: string
  onChange: (value: any, option: ComboboxItem) => void
}

export const TimezonePicker: React.FC<TimezonePickerProps> = ({
  value,
  onChange,
  ...selectProps
}) => {
  const [triggerFetch, result] = useLazyGetTimezonesQuery()
  const {data: timezone_data, isLoading, isError} = result

  const handleDropdownOpen = () => {
    triggerFetch()
  }

  return (
    <Select
      label="Timezone"
      placeholder="Select your timezone"
      value={value}
      onChange={onChange}
      data={timezone_data?.timezones}
      searchable
      onDropdownOpen={handleDropdownOpen}
      disabled={isLoading || isError}
      error={isError ? "Failed to load timezones" : null}
      nothingFoundMessage={
        isLoading ? "Loading timezones..." : "No timezones found"
      }
      maxDropdownHeight={300}
      comboboxProps={{shadow: "md"}}
      {...selectProps}
    />
  )
}

export default TimezonePicker
