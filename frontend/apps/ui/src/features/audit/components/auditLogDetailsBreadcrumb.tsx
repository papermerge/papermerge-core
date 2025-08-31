import {PanelMode} from "@/types"
import {Breadcrumbs} from "@mantine/core"
import {Link} from "react-router-dom"

interface Args {
  auditLogID: string
  mode: PanelMode
}

export default function AuditLogDetailsBreadcrumb({auditLogID, mode}: Args) {
  if (mode == "main") {
    return (
      <Breadcrumbs separatorMargin="md" mt="xs">
        <Link to="/audit-logs/">Audit Logs</Link>
        <Link to={`/audit-logs/${auditLogID}`}>{auditLogID}</Link>
      </Breadcrumbs>
    )
  }

  return (
    <Breadcrumbs separatorMargin="md" mt="xs">
      <div>Audit Logs</div>
      <div>{auditLogID}</div>
    </Breadcrumbs>
  )
}
