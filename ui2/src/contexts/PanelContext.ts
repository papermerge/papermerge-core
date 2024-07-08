import {createContext} from "react"
import type {PanelMode} from "@/types"

/*
`@/component/DualPanel` component features two panels. One of the panels
is called "main" and another one "secondary". Both panels
are rendered using same `@/components/SinglePanel` component. In
order to distinguish between the two - panel mode is passed as via
react context.
Panel with mode "main" (i.e. main panel) is always present.
Panel with mode "secondary" - may or may not be present; in other
words, "secondary" panel may be closed, while "main" panel
cannot be closed.
*/
const PanelContext = createContext<PanelMode>("main")

export default PanelContext
