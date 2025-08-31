import {useAppSelector} from "@/app/hooks"
import {useGetAuditLogQuery} from "@/features/audit/apiSlice"
import {selectAuditLogDetailsID} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {Stack} from "@mantine/core"
import AuditLogDetails from "./Details"
import AuditLogDetailsBreadcrumb from "./auditLogDetailsBreadcrumb"

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
    <Stack>
      <AuditLogDetailsBreadcrumb auditLogID={data.id} mode={mode} />
      <AuditLogDetails auditLog={data} />
    </Stack>
  )
}
