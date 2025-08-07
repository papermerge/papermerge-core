import {
  Box,
  Button,
  Group,
  Modal,
  Space,
  ScrollArea,
  CheckedNodeStatus
} from "@mantine/core"
import {RoleForm, SubmitButton} from "kommon"

interface Args {
  txt?: {
    name: string
    submit: string
    cancel: string
  }
  error?: string
  initialCheckedState: string[]
  title: string
  name?: string // i.e. field "name" from the role form
  opened: boolean
  inProgress: boolean
  onPermissionsChange?: (checkedPermissions: CheckedNodeStatus[]) => void
  onNameChange?: (value: string) => void
  onSubmit?: () => void
  onCancel?: () => void
}

const EmptyFunc = () => {}

export default function RoleFormModal({
  txt,
  inProgress,
  title,
  opened,
  name,
  initialCheckedState,
  onPermissionsChange,
  onNameChange,
  onCancel,
  onSubmit,
  error
}: Args) {
  return (
    <Modal
      title={title}
      opened={opened}
      size="lg"
      onClose={onCancel || EmptyFunc}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%"
        }}
      >
        <ScrollArea style={{flex: 1}}>
          <RoleForm
            name={name}
            isLoading={inProgress}
            withScrollArea={false}
            initialCheckedState={initialCheckedState}
            onPermissionsChange={onPermissionsChange}
            onNameChange={onNameChange}
          />
        </ScrollArea>
        {error}
        <Space h="md" />
        <Box
          pt="sm"
          style={{
            borderTop: "1px solid #e0e0e0",
            backgroundColor: "white",
            position: "sticky",
            bottom: 0,
            zIndex: 1,
            padding: "1rem"
          }}
        >
          <Group gap="lg" justify="space-between">
            <Button variant="default" onClick={onCancel}>
              {txt?.cancel || "Cancel"}
            </Button>
            <SubmitButton
              onClick={onSubmit}
              inProgress={inProgress}
              text={txt?.submit || "Submit"}
            />
          </Group>
        </Box>
      </Box>
    </Modal>
  )
}
