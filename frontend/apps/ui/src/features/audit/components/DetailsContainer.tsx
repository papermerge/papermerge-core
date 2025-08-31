import {useAppSelector} from "@/app/hooks"
import {useGetAuditLogQuery} from "@/features/audit/apiSlice"
import {selectAuditLogDetailsID} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import AuditLogDetails from "./Details"

export default function AuditLogDetailsContainer() {
  const mode = usePanelMode()
  const auditLogID = useAppSelector(s => selectAuditLogDetailsID(s, mode))
  const {data, isLoading, error} = useGetAuditLogQuery(auditLogID || "", {
    skip: !auditLogID
  })

  if (isLoading) return <div>Loading...</div>

  if (error) return <div>Error loading audit log</div>

  if (!data) {
    return <div>Loading...</div>
  }

  return (
    <>
      <AuditLogDetails auditLog={data} />
    </>
  )
}
