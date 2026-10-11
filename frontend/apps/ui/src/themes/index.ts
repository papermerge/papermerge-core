import {createTheme, mergeThemeOverrides} from "@mantine/core"
import {theme as blue} from "./blue"
import {theme as brown} from "./brown"
import {theme as gray} from "./gray"
import {theme as green} from "./green"

const THEMES = {gray, blue, green, brown}

const currentThemeName = "blue"

// Mantine 9 changed the default radius from "sm" to "md"
const sharedOverrides = createTheme({defaultRadius: "sm"})

const currentTheme = mergeThemeOverrides(
  sharedOverrides,
  THEMES[currentThemeName]
)

export default currentTheme
