import {useState} from "react"
import {Switch, useMantineColorScheme} from "@mantine/core"

export function ColorSchemeToggle() {
  const {setColorScheme} = useMantineColorScheme()
  const [checked, setChecked] = useState(false)

  const onToggleColorScheme = () => {
    if (checked) {
      setColorScheme("dark")
    } else {
      setColorScheme("light")
    }
    setChecked(!checked)
  }

  return (
    <Switch
      checked={checked}
      onChange={onToggleColorScheme}
      label="Dark mode"
    />
  )
}
