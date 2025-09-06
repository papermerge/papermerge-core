import {useAppSelector} from "@/app/hooks"

import {useContext} from "react"

import PanelContext from "@/contexts/PanelContext"

import type {PanelMode} from "@/types"

import Viewer from "@/features/document/components/Viewer"

import {AuditLogDetails, AuditLogsList} from "@/features/audit/components"
import Commander from "@/features/nodes/components/Commander"
import {RoleDetails, RolesList} from "@/features/roles/components"
import SearchResults from "@/features/search/components/SearchResults"
import SharedCommander from "@/features/shared_nodes/components/SharedCommander"
import SharedViewer from "@/features/shared_nodes/components/SharedViewer"
import type {PanelComponent} from "@/types.d/ui"

import {selectPanelComponent} from "@/features/ui/uiSlice"

const PANEL_COMPONENTS_SAFE = {
  commander: Commander,
  viewer: Viewer,
  searchResults: SearchResults,
  sharedCommander: SharedCommander,
  sharedViewer: SharedViewer,
  auditLogDetails: AuditLogDetails,
  auditLogList: AuditLogsList,
  rolesList: RolesList,
  roleDetails: RoleDetails
} satisfies Record<PanelComponent, React.ComponentType>

export default function SinglePanel() {
  const mode: PanelMode = useContext(PanelContext)
  const panelComponent = useAppSelector(s => selectPanelComponent(s, mode))

  if (!panelComponent) {
    return <div>No panel component selected</div>
  }

  const Component = PANEL_COMPONENTS_SAFE[panelComponent]
  return <Component />
}
