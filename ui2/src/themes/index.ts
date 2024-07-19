import {theme as blue} from "./blue"
import {theme as gray} from "./gray"

const THEMES = {
  gray: gray,
  blue: blue
}

const currentThemeName = "gray"

const currentTheme = THEMES[currentThemeName]

export default currentTheme
