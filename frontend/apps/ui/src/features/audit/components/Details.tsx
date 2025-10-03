import {useAppSelector} from "@/app/hooks"
import {selectMyPreferences} from "@/features/preferences/storage/preference"
import {formatTimestamp} from "@/utils/formatTimestamp"
import {Paper} from "@mantine/core"
import {TFunction} from "i18next"
import {CopyableTextArea, CopyableTextInput} from "kommon"
import {AuditLogDetails} from "../types"

interface Args {
  auditLog: AuditLogDetails
  t?: TFunction
}

export default function AuditLogDetailsComponent({auditLog, t}: Args) {
  const {timestamp_format, timezone} = useAppSelector(selectMyPreferences)

  return (
    <Paper style={{height: "100%"}} className="scrollable-y">
      <CopyableTextInput
        value={auditLog?.id}
        label={t?.("auditLogDetails.id") || "Audit Log ID"}
        py="xs"
      />
      <CopyableTextInput
        value={formatTimestamp(auditLog.timestamp, timestamp_format, timezone)}
        label={t?.("auditLogDetails.timestamp") || "Timestamp"}
        py="xs"
      />
      <CopyableTextInput
        value={auditLog?.operation}
        label={t?.("auditLogDetails.operation") || "Operation"}
        py="xs"
      />
      <CopyableTextInput
        value={auditLog?.table_name}
        label={t?.("auditLogDetails.table_name") || "Table Name"}
        py="sm"
      />
      <CopyableTextInput
        value={auditLog?.record_id}
        label={t?.("auditLogDetails.record_id") || "Record ID"}
        py="xs"
      />
      <CopyableTextInput
        value={auditLog?.username}
        label={t?.("auditLogDetails.username") || "Username"}
        py="xs"
      />
      <CopyableTextInput
        value={auditLog?.user_id}
        label={t?.("auditLogDetails.user_id") || "User ID"}
        py="xs"
      />
      <CopyableTextArea
        value={formatValue(auditLog?.old_values)}
        autosize
        label={t?.("auditLogDetails.old_values") || "Old Values"}
        py="xs"
      />
      <CopyableTextArea
        value={formatValue(auditLog?.new_values)}
        autosize
        label={t?.("auditLogDetails.new_values") || "New Values"}
        py="xs"
      />
      <CopyableTextInput
        value={auditLog?.changed_fields || ""}
        label={t?.("auditLogDetails.changed_fields") || "Changed Fields"}
        py="xs"
      />
      <CopyableTextInput
        value={auditLog?.audit_message || ""}
        label={t?.("auditLogDetails.audit_message") || "Audit Message"}
        py="xs"
      />
    </Paper>
  )
}

const formatValue = (value: string | null | undefined): string => {
  if (!value) return ""

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return value // Return as-is if not valid JSON
  }
}
