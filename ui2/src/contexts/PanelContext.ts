import {createContext} from "react"
import type {PanelMode} from "@/types"

const PanelContext = createContext<PanelMode>("main")

export default PanelContext
