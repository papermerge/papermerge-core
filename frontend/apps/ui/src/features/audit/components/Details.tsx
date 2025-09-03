import {Paper, ScrollArea} from "@mantine/core"
import {CopyableTextArea, CopyableTextInput} from "kommon"
import {AuditLogDetails} from "../types"

interface Args {
  auditLog: AuditLogDetails
}

export default function AuditLogDetailsComponent({auditLog}: Args) {
  return (
    <Paper px="md">
      <ScrollArea h={800}>
        <CopyableTextInput value={auditLog?.id} label={"Audit Log ID"} />
        <CopyableTextInput value={auditLog?.timestamp} label={"Timestamp"} />
        <CopyableTextInput value={auditLog?.operation} label={"Operation"} />
        <CopyableTextInput value={auditLog?.table_name} label={"Table Name"} />
        <CopyableTextInput value={auditLog?.record_id} label={"Record ID"} />
        <CopyableTextInput value={auditLog?.username} label={"Username"} />
        <CopyableTextInput value={auditLog?.user_id} label={"User ID"} />
        <CopyableTextArea
          value={formatValue(auditLog?.old_values)}
          autosize
          label={"Old Values"}
        />
        <CopyableTextArea
          value={formatValue(auditLog?.new_values)}
          autosize
          label={"New Values"}
        />
        <CopyableTextInput
          value={auditLog?.changed_fields || ""}
          label={"Changed Fields"}
        />
        <CopyableTextInput
          value={auditLog?.audit_message || ""}
          label={"Audit Message"}
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
