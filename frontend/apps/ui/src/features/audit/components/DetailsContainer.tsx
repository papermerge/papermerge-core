import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import LoadingPanel from "@/components/LoadingPanel"
import {useGetAuditLogQuery} from "@/features/audit/storage/api"
import {selectAuditLogDetailsID} from "@/features/audit/storage/audit"
import {closeAuditLogDetailsSecondaryPanel} from "@/features/audit/storage/thunks"
import {usePanelMode} from "@/hooks"
import {Group, LoadingOverlay, Paper, Stack} from "@mantine/core"
import {useTranslation} from "react-i18next"
import AuditLogDetailsBreadcrumb from "./auditLogDetailsBreadcrumb"
import AuditLogDetails from "./Details"

export default function AuditLogDetailsContainer() {
  const {t} = useTranslation()
  const mode = usePanelMode()
  const dispatch = useAppDispatch()
  const auditLogID = useAppSelector(s => selectAuditLogDetailsID(s, mode))
  const {data, isLoading, isFetching, error} = useGetAuditLogQuery(
    auditLogID || "",
    {
      skip: !auditLogID
    }
  )

  if (isLoading) return <LoadingPanel />

  if (error) return <div>Error loading audit log</div>

  if (!data) {
    return <LoadingPanel />
  }

  return (
    <Paper p="md" withBorder style={{height: "100%", position: "relative"}}>
      <LoadingOverlay visible={isFetching} />
      <Stack style={{height: "100%"}}>
        <Group justify="space-between">
          <AuditLogDetailsBreadcrumb t={t} auditLogID={data.id} mode={mode} />
          <CloseSecondaryPanel
            onClick={() => dispatch(closeAuditLogDetailsSecondaryPanel())}
          />
        </Group>
        <AuditLogDetails t={t} auditLog={data} />
      </Stack>
    </Paper>
  )
}
