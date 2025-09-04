import {Paper, ScrollArea} from "@mantine/core"
import {TFunction} from "i18next"
import {CopyableTextArea, CopyableTextInput} from "kommon"
import {AuditLogDetails} from "../types"

interface Args {
  auditLog: AuditLogDetails
  t?: TFunction
}

export default function AuditLogDetailsComponent({auditLog, t}: Args) {
  return (
    <Paper px="md">
      <ScrollArea h={800}>
        <CopyableTextInput
          value={auditLog?.id}
          label={t?.("auditLogDetails.id") || "Audit Log ID"}
        />
        <CopyableTextInput
          value={auditLog?.timestamp}
          label={t?.("auditLogDetails.timestamp") || "Timestamp"}
        />
        <CopyableTextInput
          value={auditLog?.operation}
          label={t?.("auditLogDetails.operation") || "Operation"}
        />
        <CopyableTextInput
          value={auditLog?.table_name}
          label={t?.("auditLogDetails.table_name") || "Table Name"}
        />
        <CopyableTextInput
          value={auditLog?.record_id}
          label={t?.("auditLogDetails.record_id") || "Record ID"}
        />
        <CopyableTextInput
          value={auditLog?.username}
          label={t?.("auditLogDetails.username") || "Username"}
        />
        <CopyableTextInput
          value={auditLog?.user_id}
          label={t?.("auditLogDetails.user_id") || "User ID"}
        />
        <CopyableTextArea
          value={formatValue(auditLog?.old_values)}
          autosize
          label={t?.("auditLogDetails.old_values") || "Old Values"}
        />
        <CopyableTextArea
          value={formatValue(auditLog?.new_values)}
          autosize
          label={t?.("auditLogDetails.new_values") || "New Values"}
        />
        <CopyableTextInput
          value={auditLog?.changed_fields || ""}
          label={t?.("auditLogDetails.changed_fields") || "Changed Fields"}
        />
        <CopyableTextInput
          value={auditLog?.audit_message || ""}
          label={t?.("auditLogDetails.audit_message") || "Audit Message"}
        />
      </ScrollArea>
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
