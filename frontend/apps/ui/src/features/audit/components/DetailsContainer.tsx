import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import {useGetAuditLogQuery} from "@/features/audit/storage/api"
import {selectAuditLogDetailsID} from "@/features/audit/storage/audit"
import {closeAuditLogDetailsSecondaryPanel} from "@/features/audit/storage/thunks"
import {usePanelMode} from "@/hooks"
import {Group, Stack} from "@mantine/core"
import {useTranslation} from "react-i18next"
import AuditLogDetailsBreadcrumb from "./auditLogDetailsBreadcrumb"
import AuditLogDetails from "./Details"

export default function AuditLogDetailsContainer() {
  const {t} = useTranslation()
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
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
        <CloseSecondaryPanel
          onClick={() => dispatch(closeAuditLogDetailsSecondaryPanel())}
        />
      </Group>
      <AuditLogDetails t={t} auditLog={data} />
    </Stack>
  )
}
