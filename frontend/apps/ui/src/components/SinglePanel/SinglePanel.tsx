import {useAppSelector} from "@/app/hooks"
import {Box} from "@mantine/core"
import {useContext} from "react"

import PanelContext from "@/contexts/PanelContext"
import {selectPanelComponent} from "@/features/ui/panelRegistry"

import Viewer from "@/features/document/components/Viewer"

import {AuditLogDetails, AuditLogsList} from "@/features/audit/components"
import {
  CustomFieldDetails,
  CustomFieldsList
} from "@/features/custom-fields/components"
import {
  DocumentTypeDetails,
  DocumentTypesList
} from "@/features/document-types/components"
import {
  DocumentsByCategoryDetails,
  DocumentsListByCategory
} from "@/features/documentsList/components"
import {GroupDetails, GroupsList} from "@/features/groups/components"
import Commander from "@/features/nodes/components/Commander"
import {RoleDetails, RolesList} from "@/features/roles/components"
import SharedCommander from "@/features/shared_nodes/components/Commander"
import SharedViewer from "@/features/shared_nodes/components/Viewer"
import {TagDetails, TagsList} from "@/features/tags/components"
import {UserDetails, UsersList} from "@/features/users/components"
import type {PanelComponent} from "@/types.d/ui"

const PANEL_COMPONENTS_SAFE = {
  commander: Commander,
  viewer: Viewer,
  sharedCommander: SharedCommander,
  sharedViewer: SharedViewer,
  auditLogDetails: AuditLogDetails,
  auditLogList: AuditLogsList,
  rolesList: RolesList,
  roleDetails: RoleDetails,
  customFieldsList: CustomFieldsList,
  customFieldDetails: CustomFieldDetails,
  documentTypesList: DocumentTypesList,
  documentTypeDetails: DocumentTypeDetails,
  groupsList: GroupsList,
  groupDetails: GroupDetails,
  tagsList: TagsList,
  tagDetails: TagDetails,
  usersList: UsersList,
  userDetails: UserDetails,
  documentsListByCategory: DocumentsListByCategory,
  documentsByCategoryDetails: DocumentsByCategoryDetails
} satisfies Record<PanelComponent, React.ComponentType>

interface Args {
  className: string
}

export default function SinglePanel({className}: Args) {
  const panelId = useContext(PanelContext)
  const panelComponent = useAppSelector(s => selectPanelComponent(s, panelId))

  if (!panelComponent) {
    return <Box className={className}>No panel component selected</Box>
  }

  const Component = PANEL_COMPONENTS_SAFE[panelComponent]
  return (
    <Box className={className}>
      <Component />
    </Box>
  )
}
