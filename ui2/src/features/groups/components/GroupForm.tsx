import {TextInput, Table, Checkbox, Tooltip} from "@mantine/core"
import CopyButton from "@/components/CopyButton"

import type {GroupDetails} from "@/types"

type Args = {
  group: GroupDetails | null
}

export default function GroupModal({group}: Args) {
  return (
    <div>
      <TextInput
        value={group?.name}
        onChange={() => {}}
        label="Name"
        rightSection={<CopyButton value={group?.name || ""} />}
      />
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Permissions</Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr key="document">
            <Table.Td>Documents</Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], DOCUMENT_UPLOAD)}
                label="Upload"
              />
            </Table.Td>

            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], DOCUMENT_DOWNLOAD)}
                label="Download"
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="pages">
            <Table.Td>Pages</Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], PAGE_MOVE)}
                label="Move"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], PAGE_UPDATE)}
                label="Update"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], PAGE_EXTRACT)}
                label="Extract"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], PAGE_DELETE)}
                label="Delete"
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="users">
            <Table.Td>Users</Table.Td>
            <Tooltip
              label="Grants access to users tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  checked={hasPerm(group?.scopes || [], USER_VIEW)}
                  label="View"
                />
              </Table.Td>
            </Tooltip>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], USER_CREATE)}
                label="Create"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], USER_UPDATE)}
                label="Update"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], USER_DELETE)}
                label="Delete"
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="group">
            <Table.Td>Groups</Table.Td>
            <Tooltip
              label="Grants access to groups tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  checked={hasPerm(group?.scopes || [], GROUP_VIEW)}
                  label="View"
                />
              </Table.Td>
            </Tooltip>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], GROUP_CREATE)}
                label="Create"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], GROUP_UPDATE)}
                label="Update"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], GROUP_DELETE)}
                label="Delete"
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="tags">
            <Table.Td>Tags</Table.Td>
            <Tooltip
              label="Grants access to tags tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  checked={hasPerm(group?.scopes || [], TAG_VIEW)}
                  label="View"
                />
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
                <Checkbox
                  checked={hasPerm(group?.scopes || [], TAG_CREATE)}
                  label="Create"
                />
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
                <Checkbox
                  checked={hasPerm(group?.scopes || [], TAG_UPDATE)}
                  label="Update"
                />
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
                <Checkbox
                  checked={hasPerm(group?.scopes || [], TAG_DELETE)}
                  label="Delete"
                />
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
              <Table.Td>Nodes</Table.Td>
            </Tooltip>
            <Tooltip
              label={"Grants permission to create folders"}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  checked={hasPerm(group?.scopes || [], NODE_CREATE)}
                  label="Create"
                />
              </Table.Td>
            </Tooltip>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], NODE_UPDATE)}
                label="Update"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], NODE_DELETE)}
                label="Delete"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(group?.scopes || [], NODE_MOVE)}
                label="Move"
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="tasks">
            <Table.Td>Tasks</Table.Td>
            <Tooltip
              label={"Grants permission to manually trigger OCR"}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  checked={hasPerm(group?.scopes || [], TASK_OCR)}
                  label="OCR"
                />
              </Table.Td>
            </Tooltip>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </div>
  )
}

function hasPerm(scopes: string[], perm: string): boolean {
  return scopes.includes(perm)
}

const DOCUMENT_DOWNLOAD = "document.download"
const DOCUMENT_UPLOAD = "document.upload"
const PAGE_MOVE = "page.move"
const PAGE_UPDATE = "page.update"
const PAGE_DELETE = "page.delete"
const PAGE_EXTRACT = "page.extract"
const USER_VIEW = "user.view"
const USER_CREATE = "user.create"
const USER_UPDATE = "user.update"
const USER_DELETE = "user.delete"
const GROUP_VIEW = "group.view"
const GROUP_CREATE = "group.create"
const GROUP_UPDATE = "group.update"
const GROUP_DELETE = "group.delete"
const TAG_VIEW = "tag.view"
const TAG_CREATE = "tag.create"
const TAG_UPDATE = "tag.update"
const TAG_DELETE = "tag.delete"
const NODE_CREATE = "node.create"
const NODE_UPDATE = "node.update"
const NODE_DELETE = "node.delete"
const NODE_MOVE = "node.move"
const TASK_OCR = "task.ocr"
