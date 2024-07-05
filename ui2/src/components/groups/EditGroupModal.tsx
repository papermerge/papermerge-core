import {useDispatch, useSelector} from "react-redux"
import {useState, useEffect} from "react"
import {
  Modal,
  LoadingOverlay,
  Group,
  Button,
  TextInput,
  Table,
  Checkbox,
  Tooltip
} from "@mantine/core"

import {updateGroup} from "@/slices/groups"
import {selectGroupDetails} from "@/slices/groupDetails"
import {RootState} from "@/app/types"
import type {GroupDetails, SliceState} from "@/types"

function initialScopesDict(initialScopes: string[]): Record<string, boolean> {
  let scopes: Record<string, boolean> = {
    "user.me": true,
    "page.view": true,
    "node.view": true,
    "ocrlang.view": true
  }
  initialScopes.map(i => (scopes[i] = true))

  return scopes
}

type Args = {
  groupId: number
  onOK: (value: GroupDetails) => void
  onCancel: (reason?: any) => void
}

export default function EditGroupModal({groupId, onOK, onCancel}: Args) {
  const dispatch = useDispatch()
  const {status, data} = useSelector<RootState>(
    selectGroupDetails
  ) as SliceState<GroupDetails>
  const [show, setShow] = useState<boolean>(true)
  const [name, setName] = useState<string>()
  const [scopes, setScopes] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (data) {
      setName(data.name)
      setScopes(initialScopesDict(data.scopes))
    }
  }, [status])

  const onSubmit = async () => {
    const updatedData = {
      id: groupId,
      scopes: Object.keys(scopes),
      name: name!
    }
    await dispatch(updateGroup(updatedData))
    onOK(updatedData)
    setShow(false)
  }

  const onClose = () => {
    onCancel()
    setShow(false)
  }

  const onChangeAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newScopes: Record<string, boolean> = {}

    if (event.target.checked) {
      ALL_PERMS.forEach(p => (newScopes[p] = true))
      setScopes(newScopes)
    } else {
      newScopes = {}
      setScopes(newScopes)
    }
  }
  const onChangePerm = (perm: string, checked: boolean) => {
    let newScopes: Record<string, boolean> = {}

    if (checked) {
      Object.keys(scopes).forEach(p => {
        newScopes[p] = true
      })
      newScopes[perm] = true
      setScopes(newScopes)
    } else {
      Object.keys(scopes).forEach(p => {
        if (p != perm) {
          newScopes[p] = true
        }
      })
      setScopes(newScopes)
    }
  }
  const onChangePerms = (perms: string[], checked: boolean) => {
    let newScopes: Record<string, boolean> = {}

    if (checked) {
      Object.keys(scopes).forEach(p => {
        newScopes[p] = true
      })
      perms.forEach(p => (newScopes[p] = true))
      setScopes(newScopes)
    } else {
      Object.keys(scopes).forEach(p => {
        if (!perms.find(i => i == p)) {
          newScopes[p] = true
        }
      })
      setScopes(newScopes)
    }
  }

  const onNameChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.currentTarget.value)
  }

  return (
    <Modal title={"Edit Group"} opened={show} size="lg" onClose={onClose}>
      <LoadingOverlay
        visible={data == null || status == "loading"}
        zIndex={1000}
        overlayProps={{radius: "sm", blur: 2}}
      />
      <TextInput
        value={name}
        onChange={onNameChangeHandler}
        label="Name"
        placeholder="Group name"
      />
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
                checked={hasPerms(scopes, [DOCUMENT_UPLOAD, DOCUMENT_DOWNLOAD])}
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
                onChange={e => onChangePerm(DOCUMENT_UPLOAD, e.target.checked)}
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
              <Checkbox
                checked={hasPerms(scopes, [
                  PAGE_UPDATE,
                  PAGE_MOVE,
                  PAGE_DELETE,
                  PAGE_EXTRACT
                ])}
                onChange={e =>
                  onChangePerms(
                    [PAGE_UPDATE, PAGE_MOVE, PAGE_DELETE, PAGE_EXTRACT],
                    e.target.checked
                  )
                }
                label="Pages"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, PAGE_MOVE)}
                onChange={e => onChangePerm(PAGE_MOVE, e.target.checked)}
                label="Move"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, PAGE_UPDATE)}
                onChange={e => onChangePerm(PAGE_UPDATE, e.target.checked)}
                label="Update"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, PAGE_EXTRACT)}
                onChange={e => onChangePerm(PAGE_EXTRACT, e.target.checked)}
                label="Extract"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, PAGE_DELETE)}
                onChange={e => onChangePerm(PAGE_DELETE, e.target.checked)}
                label="Delete"
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="users">
            <Table.Td>
              <Checkbox
                checked={hasPerms(scopes, [
                  USER_VIEW,
                  USER_CREATE,
                  USER_UPDATE,
                  USER_DELETE
                ])}
                onChange={e =>
                  onChangePerms(
                    [USER_VIEW, USER_CREATE, USER_UPDATE, USER_DELETE],
                    e.target.checked
                  )
                }
                label="Users"
              />
            </Table.Td>
            <Tooltip
              label="Grants access to users tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  checked={hasPerm(scopes, USER_VIEW)}
                  onChange={e => onChangePerm(USER_VIEW, e.target.checked)}
                  label="View"
                />
              </Table.Td>
            </Tooltip>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, USER_CREATE)}
                onChange={e => onChangePerm(USER_CREATE, e.target.checked)}
                label="Create"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, USER_UPDATE)}
                onChange={e => onChangePerm(USER_UPDATE, e.target.checked)}
                label="Update"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, USER_DELETE)}
                onChange={e => onChangePerm(USER_DELETE, e.target.checked)}
                label="Delete"
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="group">
            <Table.Td>
              <Checkbox
                checked={hasPerms(scopes, [
                  GROUP_VIEW,
                  GROUP_CREATE,
                  GROUP_UPDATE,
                  GROUP_DELETE
                ])}
                onChange={e =>
                  onChangePerms(
                    [GROUP_VIEW, GROUP_CREATE, GROUP_UPDATE, GROUP_DELETE],
                    e.target.checked
                  )
                }
                label="Groups"
              />
            </Table.Td>
            <Tooltip
              label="Grants access to groups tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  checked={hasPerm(scopes, GROUP_VIEW)}
                  onChange={e => onChangePerm(GROUP_VIEW, e.target.checked)}
                  label="View"
                />
              </Table.Td>
            </Tooltip>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, GROUP_CREATE)}
                onChange={e => onChangePerm(GROUP_CREATE, e.target.checked)}
                label="Create"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, GROUP_UPDATE)}
                onChange={e => onChangePerm(GROUP_UPDATE, e.target.checked)}
                label="Update"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, GROUP_DELETE)}
                onChange={e => onChangePerm(GROUP_DELETE, e.target.checked)}
                label="Delete"
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="tags">
            <Table.Td>
              <Checkbox
                checked={hasPerms(scopes, [
                  TAG_VIEW,
                  TAG_CREATE,
                  TAG_UPDATE,
                  TAG_DELETE
                ])}
                onChange={e =>
                  onChangePerms(
                    [TAG_VIEW, TAG_CREATE, TAG_UPDATE, TAG_DELETE],
                    e.target.checked
                  )
                }
                label="Tags"
              />
            </Table.Td>
            <Tooltip
              label="Grants access to tags tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  checked={hasPerm(scopes, TAG_VIEW)}
                  onChange={e => onChangePerm(TAG_VIEW, e.target.checked)}
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
                  checked={hasPerm(scopes, TAG_CREATE)}
                  onChange={e => onChangePerm(TAG_CREATE, e.target.checked)}
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
                  checked={hasPerm(scopes, TAG_UPDATE)}
                  onChange={e => onChangePerm(TAG_UPDATE, e.target.checked)}
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
                  checked={hasPerm(scopes, TAG_DELETE)}
                  onChange={e => onChangePerm(TAG_DELETE, e.target.checked)}
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
              <Table.Td>
                <Checkbox
                  checked={hasPerms(scopes, [
                    NODE_CREATE,
                    NODE_DELETE,
                    NODE_MOVE,
                    NODE_UPDATE
                  ])}
                  onChange={e =>
                    onChangePerms(
                      [NODE_CREATE, NODE_DELETE, NODE_MOVE, NODE_UPDATE],
                      e.target.checked
                    )
                  }
                  label="Nodes"
                />
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
                <Checkbox
                  checked={hasPerm(scopes, NODE_CREATE)}
                  onChange={e => onChangePerm(NODE_CREATE, e.target.checked)}
                  label="Create"
                />
              </Table.Td>
            </Tooltip>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, NODE_UPDATE)}
                onChange={e => onChangePerm(NODE_UPDATE, e.target.checked)}
                label="Update"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, NODE_DELETE)}
                onChange={e => onChangePerm(NODE_DELETE, e.target.checked)}
                label="Delete"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(scopes, NODE_MOVE)}
                onChange={e => onChangePerm(NODE_MOVE, e.target.checked)}
                label="Move"
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="tasks">
            <Table.Td>
              <Checkbox
                checked={hasPerms(scopes, [TASK_OCR])}
                onChange={e => onChangePerms([TASK_OCR], e.target.checked)}
                label="Tasks"
              />
            </Table.Td>
            <Tooltip
              label={"Grants permission to manually trigger OCR"}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  checked={hasPerm(scopes, TASK_OCR)}
                  onChange={e => onChangePerm(TASK_OCR, e.target.checked)}
                  label="OCR"
                />
              </Table.Td>
            </Tooltip>
          </Table.Tr>
        </Table.Tbody>
      </Table>
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>Submit</Button>
      </Group>
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
const PAGE_VIEW = "page.view"
const PAGE_MOVE = "page.move"
const PAGE_UPDATE = "page.update"
const PAGE_DELETE = "page.delete"
const PAGE_EXTRACT = "page.extract"
const USER_VIEW = "user.view"
const USER_CREATE = "user.create"
const USER_UPDATE = "user.update"
const USER_DELETE = "user.delete"
const USER_ME = "user.me"
const GROUP_VIEW = "group.view"
const GROUP_CREATE = "group.create"
const GROUP_UPDATE = "group.update"
const GROUP_DELETE = "group.delete"
const TAG_VIEW = "tag.view"
const TAG_CREATE = "tag.create"
const TAG_UPDATE = "tag.update"
const TAG_DELETE = "tag.delete"
const NODE_VIEW = "node.view"
const NODE_CREATE = "node.create"
const NODE_UPDATE = "node.update"
const NODE_DELETE = "node.delete"
const NODE_MOVE = "node.move"
const TASK_OCR = "task.ocr"
const OCRLANG_VIEW = "ocrlang.view"

const ALL_PERMS = [
  DOCUMENT_DOWNLOAD,
  DOCUMENT_UPLOAD,
  PAGE_VIEW,
  PAGE_MOVE,
  PAGE_UPDATE,
  PAGE_DELETE,
  PAGE_EXTRACT,
  USER_VIEW,
  USER_CREATE,
  USER_UPDATE,
  USER_DELETE,
  USER_ME,
  GROUP_VIEW,
  GROUP_CREATE,
  GROUP_UPDATE,
  GROUP_DELETE,
  TAG_VIEW,
  TAG_CREATE,
  TAG_UPDATE,
  TAG_DELETE,
  NODE_VIEW,
  NODE_MOVE,
  NODE_CREATE,
  NODE_UPDATE,
  NODE_DELETE,
  TASK_OCR,
  OCRLANG_VIEW
]
