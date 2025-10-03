import {MantineColorScheme, useMantineColorScheme} from "@mantine/core"
import {useEffect} from "react"

import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {useAppSelector} from "./useApp"

export default function useUITheme() {
  const {colorScheme, setColorScheme} = useMantineColorScheme()

  const {ui_theme} = useAppSelector(selectMyPreferences)

  useEffect(() => {
    if (ui_theme && isValidColorScheme(ui_theme) && colorScheme !== ui_theme) {
      setColorScheme(ui_theme as MantineColorScheme)
    }
  }, [ui_theme, colorScheme, setColorScheme])
}

const isValidColorScheme = (theme: string): theme is MantineColorScheme => {
  return ["light", "dark"].includes(theme)
}
