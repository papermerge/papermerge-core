import {theme as blue} from "./blue"
import {theme as gray} from "./gray"
import {theme as green} from "./green"
import {theme as brown} from "./brown"

const THEMES = {gray, blue, green, brown}

const currentThemeName = "blue"

const currentTheme = THEMES[currentThemeName]

export default currentTheme
