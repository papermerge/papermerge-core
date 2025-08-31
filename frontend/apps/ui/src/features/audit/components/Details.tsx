import {Paper, ScrollArea, TextInput, Textarea} from "@mantine/core"
import {AuditLogDetails} from "../types"

interface Args {
  auditLog: AuditLogDetails
}

export default function AuditLogDetailsComponent({auditLog}: Args) {
  return (
    <Paper>
      <ScrollArea h={800}>
        <TextInput
          value={auditLog?.id}
          readOnly={true}
          label={"Audit Log ID"}
        />
        <TextInput
          value={auditLog?.timestamp}
          readOnly={true}
          label={"Timestamp"}
        />
        <TextInput
          value={auditLog?.operation}
          readOnly={true}
          label={"Operation"}
        />
        <TextInput
          value={auditLog?.table_name}
          readOnly={true}
          label={"Table Name"}
        />
        <TextInput
          value={auditLog?.record_id}
          readOnly={true}
          label={"Record ID"}
        />
        <TextInput
          value={auditLog?.username}
          readOnly={true}
          label={"Username"}
        />
        <TextInput
          value={auditLog?.user_id}
          readOnly={true}
          label={"User ID"}
        />
        <Textarea
          value={formatValue(auditLog?.old_values)}
          readOnly={true}
          autosize
          label={"Old Values"}
        />
        <Textarea
          value={formatValue(auditLog?.new_values)}
          autosize
          readOnly={true}
          label={"New Values"}
        />
        <TextInput
          value={auditLog?.changed_fields}
          readOnly={true}
          label={"Changed Fields"}
        />
        <Textarea
          value={auditLog?.audit_message}
          readOnly={true}
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
