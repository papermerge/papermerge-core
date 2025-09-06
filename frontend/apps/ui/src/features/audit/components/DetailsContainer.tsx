import {useAppSelector} from "@/app/hooks"
import {useGetAuditLogQuery} from "@/features/audit/storage/api"
import {selectAuditLogDetailsID} from "@/features/audit/storage/audit"
import {usePanelMode} from "@/hooks"
import {Group, Stack} from "@mantine/core"
import {useTranslation} from "react-i18next"
import AuditLogDetailsBreadcrumb from "./auditLogDetailsBreadcrumb"
import CloseSecondaryPanel from "./CloseSecondaryPanel"
import AuditLogDetails from "./Details"

export default function AuditLogDetailsContainer() {
  const {t} = useTranslation()
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
      <Group justify="space-between">
        <AuditLogDetailsBreadcrumb t={t} auditLogID={data.id} mode={mode} />
        <CloseSecondaryPanel />
      </Group>
      <AuditLogDetails t={t} auditLog={data} />
    </Stack>
  )
}
