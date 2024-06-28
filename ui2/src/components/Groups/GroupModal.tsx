import {useState} from "react"

import {
  Modal,
  Container,
  Space,
  Group,
  Button,
  TextInput,
  Table,
  Checkbox,
  Tooltip
} from "@mantine/core"

type Args = {
  opened: boolean
  onClose: () => void
}

export default function GroupModal({opened, onClose}: Args) {
  const [scopes, setScopes] = useState<Record<string, boolean>>({})

  const onChangeAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      let newScopes: Record<string, boolean> = {}
      ALL_PERMS.forEach(p => (newScopes[p] = true))
      setScopes(newScopes)
    } else {
      setScopes({})
    }
  }
  const onChangePerm = (perm: string, checked: boolean) => {
    if (checked) {
      let newScopes: Record<string, boolean> = {}
      Object.keys(scopes).forEach(p => {
        newScopes[p] = true
      })
      newScopes[perm] = true
      console.log(newScopes)
      setScopes(newScopes)
    } else {
      let newScopes: Record<string, boolean> = {}
      Object.keys(scopes).forEach(p => {
        if (p != perm) {
          newScopes[p] = true
        }
      })
      console.log(newScopes)
      setScopes(newScopes)
    }
  }
  const onChangePerms = (perms: string[], checked: boolean) => {
    if (checked) {
      let newScopes: Record<string, boolean> = {}
      Object.keys(scopes).forEach(p => {
        newScopes[p] = true
      })
      perms.forEach(p => (newScopes[p] = true))
      setScopes(newScopes)
    } else {
      let newScopes: Record<string, boolean> = {}
      Object.keys(scopes).forEach(p => {
        if (!perms.find(i => i == p)) {
          newScopes[p] = true
        }
      })
      setScopes(newScopes)
    }
  }

  return (
    <Modal opened={opened} size={"xl"} onClose={onClose} title="New Group">
      <Container>
        <TextInput label="Name" placeholder="Group name" />
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Permissions</Table.Th>
              <Table.Th>
                <Checkbox
                  checked={hasAllPerms(scopes)}
                  onChange={onChangeAll}
                  label="All"
                />
              </Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr key="document">
              <Table.Td>
                <Checkbox
                  checked={hasPerms(scopes, [
                    DOCUMENT_UPLOAD,
                    DOCUMENT_DOWNLOAD
                  ])}
                  onChange={e =>
                    onChangePerms(
                      [DOCUMENT_UPLOAD, DOCUMENT_DOWNLOAD],
                      e.target.checked
                    )
                  }
                  label="Documents"
                />
              </Table.Td>
              <Table.Td>
                <Checkbox
                  checked={hasPerm(scopes, DOCUMENT_UPLOAD)}
                  onChange={e =>
                    onChangePerm(DOCUMENT_UPLOAD, e.target.checked)
                  }
                  label="Upload"
                />
              </Table.Td>

              <Table.Td>
                <Checkbox
                  checked={hasPerm(scopes, DOCUMENT_DOWNLOAD)}
                  onChange={e =>
                    onChangePerm(DOCUMENT_DOWNLOAD, e.target.checked)
                  }
                  label="Download"
                />
              </Table.Td>
            </Table.Tr>
            <Table.Tr key="pages">
              <Table.Td>
                <Checkbox defaultChecked label="Pages" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Move" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Update" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Extract" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Delete" />
              </Table.Td>
            </Table.Tr>
            <Table.Tr key="users">
              <Table.Td>
                <Checkbox defaultChecked label="Users" />
              </Table.Td>
              <Tooltip
                label="Grants access to users tab on left side navigation panel"
                multiline
                w={300}
                openDelay={2000}
                withArrow
              >
                <Table.Td>
                  <Checkbox defaultChecked label="View" />
                </Table.Td>
              </Tooltip>
              <Table.Td>
                <Checkbox defaultChecked label="Create" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Update" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Delete" />
              </Table.Td>
            </Table.Tr>
            <Table.Tr key="group">
              <Table.Td>
                <Checkbox defaultChecked label="Groups" />
              </Table.Td>
              <Tooltip
                label="Grants access to groups tab on left side navigation panel"
                multiline
                w={300}
                openDelay={2000}
                withArrow
              >
                <Table.Td>
                  <Checkbox defaultChecked label="View" />
                </Table.Td>
              </Tooltip>
              <Table.Td>
                <Checkbox defaultChecked label="Create" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Update" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Delete" />
              </Table.Td>
            </Table.Tr>
            <Table.Tr key="tags">
              <Table.Td>
                <Checkbox defaultChecked label="Tags" />
              </Table.Td>
              <Tooltip
                label="Grants access to tags tab on left side navigation panel"
                multiline
                w={300}
                openDelay={2000}
                withArrow
              >
                <Table.Td>
                  <Checkbox defaultChecked label="View" />
                </Table.Td>
              </Tooltip>
              <Tooltip
                label="Grants access to create new tags"
                multiline
                w={300}
                openDelay={2000}
                withArrow
              >
                <Table.Td>
                  <Checkbox defaultChecked label="Create" />
                </Table.Td>
              </Tooltip>
              <Tooltip
                label="Grants access to create update tag properties e.g. change tag color"
                multiline
                w={300}
                openDelay={2000}
                withArrow
              >
                <Table.Td>
                  <Checkbox defaultChecked label="Update" />
                </Table.Td>
              </Tooltip>
              <Tooltip
                label={
                  "Grants permissions to delete tags. Note that this is not the same " +
                  "as associating tag to nodes."
                }
                multiline
                w={300}
                openDelay={2000}
                withArrow
              >
                <Table.Td>
                  <Checkbox defaultChecked label="Delete" />
                </Table.Td>
              </Tooltip>
            </Table.Tr>
            <Table.Tr key="nodes">
              <Tooltip
                label={"Nodes here means both documents and folders"}
                multiline
                w={300}
                openDelay={2000}
                withArrow
              >
                <Table.Td>
                  <Checkbox defaultChecked label="Nodes" />
                </Table.Td>
              </Tooltip>
              <Tooltip
                label={"Grants permission to create folders"}
                multiline
                w={300}
                openDelay={2000}
                withArrow
              >
                <Table.Td>
                  <Checkbox defaultChecked label="Create" />
                </Table.Td>
              </Tooltip>
              <Table.Td>
                <Checkbox defaultChecked label="Update" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Delete" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Move" />
              </Table.Td>
            </Table.Tr>

            <Table.Tr key="tasks">
              <Table.Td>
                <Checkbox defaultChecked label="Tasks" />
              </Table.Td>
              <Tooltip
                label={"Grants permission to manually trigger OCR"}
                multiline
                w={300}
                openDelay={2000}
                withArrow
              >
                <Table.Td>
                  <Checkbox defaultChecked label="OCR" />
                </Table.Td>
              </Tooltip>
            </Table.Tr>
          </Table.Tbody>
        </Table>
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => {}}>Submit</Button>
        </Group>
      </Container>
    </Modal>
  )
}

function hasPerm(scopes: Record<string, boolean>, perm: string): boolean {
  return scopes[perm] == true
}

function hasPerms(scopes: Record<string, boolean>, perms: string[]): boolean {
  return perms.every(p => scopes[p] == true)
}

/**
 * @param scopes
 * @returns `true` if and only if `scopes` contains all available permissions
 */
function hasAllPerms(scopes: Record<string, boolean>): boolean {
  const set1 = new Set(Object.keys(scopes))
  const set2 = new Set(ALL_PERMS)

  return equalSets(set1, set2)
}

function equalSets(x: Set<string>, y: Set<string>): boolean {
  const sameSize = x.size === y.size

  if (!sameSize) {
    return false
  }

  const sameElements = [...x].every(i => y.has(i))

  if (!sameElements) {
    return false
  }

  return true
}

const DOCUMENT_DOWNLOAD = "document.download"
const DOCUMENT_UPLOAD = "document.upload"
const ALL_PERMS = [DOCUMENT_DOWNLOAD, DOCUMENT_UPLOAD]
