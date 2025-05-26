import {useState} from "react"
import {
  Switch,
  useMantineColorScheme,
  useMantineTheme,
  rem
} from "@mantine/core"
import {IconSun, IconMoonStars} from "@tabler/icons-react"

export function ColorSchemeToggle() {
  const theme = useMantineTheme()
  const {setColorScheme} = useMantineColorScheme()
  const [checked, setChecked] = useState(false)

  const sunIcon = (
    <IconSun
      style={{width: rem(16), height: rem(16)}}
      stroke={2.5}
      color={theme.colors.yellow[4]}
    />
  )

  const moonIcon = (
    <IconMoonStars
      style={{width: rem(16), height: rem(16)}}
      stroke={2.5}
      color={theme.colors.pmg[9]}
    />
  )

  const onToggleColorScheme = () => {
    if (checked) {
      setColorScheme("light")
    } else {
      setColorScheme("dark")
    }
    setChecked(!checked)
  }

  return (
    <Switch
      checked={checked}
      onChange={onToggleColorScheme}
      color="dark.4"
      onLabel={sunIcon}
      offLabel={moonIcon}
    />
  )
}
