import type {PanelMode} from "@/types"

export function otherMode(mode: PanelMode): PanelMode {
  if (mode == "main") {
    return "secondary"
  }

  return "main"
}
