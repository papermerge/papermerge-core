import {useAppDispatch, useAppSelector} from "@/app/hooks"
import CloseSecondaryPanel from "@/components/CloseSecondaryPanel"
import LoadingPanel from "@/components/LoadingPanel"
import {useGetAuditLogQuery} from "@/features/audit/storage/api"
import {closeAuditLogDetailsSecondaryPanel} from "@/features/audit/storage/thunks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelDetails} from "@/features/ui/panelRegistry"

import {Group, LoadingOverlay, Paper, Stack} from "@mantine/core"
import {useTranslation} from "react-i18next"
import AuditLogDetailsBreadcrumb from "./auditLogDetailsBreadcrumb"
import AuditLogDetails from "./Details"

export default function AuditLogDetailsContainer() {
  const {t} = useTranslation()
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()
  const auditLogID = useAppSelector(s => selectPanelDetails(s, panelId))
  const {data, isLoading, isFetching, error} = useGetAuditLogQuery(
    auditLogID?.entityId || "",
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
          <AuditLogDetailsBreadcrumb
            t={t}
            auditLogID={data.id}
            panelId={panelId}
          />
          <CloseSecondaryPanel
            onClick={() => dispatch(closeAuditLogDetailsSecondaryPanel())}
          />
        </Group>
        <AuditLogDetails t={t} auditLog={data} />
      </Stack>
    </Paper>
  )
}
