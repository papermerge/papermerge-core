import {PanelMode} from "@/types"
import {Breadcrumbs} from "@mantine/core"
import {TFunction} from "i18next"
import {Link} from "react-router-dom"

interface Args {
  auditLogID: string
  mode: PanelMode
  t?: TFunction
}

export default function AuditLogDetailsBreadcrumb({auditLogID, mode, t}: Args) {
  if (mode == "main") {
    return (
      <Breadcrumbs separatorMargin="md" mt="xs">
        <Link to="/audit-logs/">{t?.("") || "Audit Logs"}</Link>
        <Link to={`/audit-logs/${auditLogID}`}>{auditLogID}</Link>
      </Breadcrumbs>
    )
  }

  return (
    <Breadcrumbs separatorMargin="md" mt="xs">
      <div>{t?.("auditLogDetails.auditLogs") || "Audit Logs"}</div>
      <div>{auditLogID}</div>
    </Breadcrumbs>
  )
}
