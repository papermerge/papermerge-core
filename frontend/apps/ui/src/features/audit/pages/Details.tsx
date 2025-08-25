import {AuditLogDetails} from "@/features/audit/components"
import {useParams} from "react-router"

export default function AuditLogDetailsPage() {
  const {auditLogId} = useParams()

  return <AuditLogDetails id={auditLogId!} />
}
