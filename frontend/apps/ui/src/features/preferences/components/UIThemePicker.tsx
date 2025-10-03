import {ComboboxItem, Select, SelectProps} from "@mantine/core"
import {TFunction} from "i18next"
import React from "react"

interface TimezonePickerProps
  extends Omit<SelectProps, "data" | "onDropdownOpen"> {
  value: string
  onChange: (value: any, option: ComboboxItem) => void
  t?: TFunction
}

export const UIThemePicker: React.FC<TimezonePickerProps> = ({
  value,
  onChange,
  t,
  ...selectProps
}) => {
  const data = [
    {
      label: t?.("preferences.theme.light") || "Light",
      value: "light"
    },
    {
      label: t?.("preferences.theme.dark") || "Dark",
      value: "dark"
    }
  ]

  return (
    <Select
      label={t?.("preferences.theme.label", {
        defaultValue: "Theme"
      })}
      placeholder={t?.("pickValue")}
      value={value}
      onChange={onChange}
      data={data}
      comboboxProps={{shadow: "md"}}
      {...selectProps}
    />
  )
}

export default UIThemePicker
