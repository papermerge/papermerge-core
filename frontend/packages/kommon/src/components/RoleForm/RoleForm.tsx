import {
  TextInput,
  Tree,
  useTree,
  Stack,
  getTreeExpandedState,
  CheckedNodeStatus
} from "@mantine/core"
import {IconChevronDown} from "@tabler/icons-react"
import {Checkbox, Group, RenderTreeNodePayload} from "@mantine/core"
import {useCallback, useMemo, useEffect} from "react"

interface Args {
  readOnly?: boolean
  initialCheckedState: string[]
  txt?: {
    name: string
  }
  onPermissionsChange?: (checkedPermissions: CheckedNodeStatus[]) => void
}

export default function RoleForm({
  txt,
  onPermissionsChange,
  initialCheckedState,
  readOnly = false
}: Args) {
  const data = useMemo(() => PERMISSIONS_TREE, [])

  const tree = useTree({
    initialCheckedState: initialCheckedState,
    initialExpandedState: getTreeExpandedState(data, "*")
  })

  useEffect(() => {
    if (onPermissionsChange) {
      const checkedPermissions = tree.getCheckedNodes()
      onPermissionsChange(checkedPermissions)
    }
  }, [tree.checkedState])

  const renderTreeNode = useCallback(
    ({
      node,
      expanded,
      hasChildren,
      elementProps,
      tree
    }: RenderTreeNodePayload) => {
      const checked = tree.isNodeChecked(node.value)
      const indeterminate = tree.isNodeIndeterminate(node.value)

      return (
        <Group gap="xs" {...elementProps}>
          <Checkbox.Indicator
            checked={checked}
            indeterminate={indeterminate}
            onClick={() => {
              if (readOnly) return
              !checked
                ? tree.checkNode(node.value)
                : tree.uncheckNode(node.value)
            }}
          />

          <Group gap={5} onClick={() => tree.toggleExpanded(node.value)}>
            <span>{node.label}</span>

            {hasChildren && (
              <IconChevronDown
                size={14}
                style={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)"
                }}
              />
            )}
          </Group>
        </Group>
      )
    },
    [readOnly]
  )

  return (
    <Stack>
      <TextInput readOnly={readOnly} label={txt?.name || "Name"} />
      <Tree
        data={data}
        tree={tree}
        levelOffset={40}
        expandOnClick={false}
        renderNode={renderTreeNode}
      />
    </Stack>
  )
}

const PERMISSIONS_TREE = [
  {
    value: "folder",
    label: "Folders",
    children: [
      {value: "folder.view", label: "View"},
      {value: "folder.create", label: "Create"},
      {value: "folder.update", label: "Update"},
      {value: "folder.move", label: "Move"},
      {value: "folder.delete", label: "Delete"}
    ]
  },
  {
    value: "document",
    label: "Documents",
    children: [
      {
        value: "document.download",
        label: "Download",
        children: [
          {
            value: "document.download.all_versions",
            label: "All versions"
          },
          {
            value: "document.download.last_version_only",
            label: "Only last version"
          }
        ]
      },
      {value: "document.upload", label: "Upload"},
      {value: "document.view", label: "View"},
      {
        value: "document.update",
        label: "Update",
        children: [
          {value: "document.update.title", label: "Title"},
          {value: "document.update.cf", label: "Custom Fields"},
          {value: "document.update.tags", label: "Tags"}
        ]
      },
      {value: "document.move", label: "Move"},
      {value: "document.delete", label: "Delete"},
      {
        value: "document.page",
        label: "Page Management",
        children: [
          {value: "document.page.extract", label: "Extract"},
          {value: "document.page.rotate", label: "Rotate"},
          {value: "document.page.reorder", label: "Reorder"},
          {value: "document.page.delete", label: "Delete"}
        ]
      }
    ]
  },
  {
    value: "tag",
    label: "Tags",
    children: [
      {value: "tag.view", label: "View"},
      {value: "tag.select", label: "Select "},
      {value: "tag.create", label: "Create"},
      {value: "tag.update", label: "Update"},
      {value: "tag.delete", label: "Delete"}
    ]
  },
  {
    value: "cf",
    label: "Custom Fields",
    children: [
      {value: "cf.view", label: "View"},
      {value: "cf.create", label: "Create"},
      {value: "cf.update", label: "Update"},
      {value: "cf.delete", label: "Delete"}
    ]
  },
  {
    value: "category",
    label: "Categories",
    children: [
      {value: "category.view", label: "View"},
      {value: "category.create", label: "Create"},
      {value: "category.update", label: "Update"},
      {value: "category.delete", label: "Delete"}
    ]
  },
  {
    value: "shared_node",
    label: "Shares",
    children: [
      {value: "shared_node.view", label: "View"},
      {value: "shared_node.create", label: "Create"},
      {value: "shared_node.update", label: "Update"},
      {value: "shared_node.delete", label: "Delete"}
    ]
  },
  {
    value: "user",
    label: "Users",
    children: [
      {value: "user.view", label: "View"},
      {value: "user.select", label: "Select"},
      {value: "user.create", label: "Create"},
      {value: "user.update", label: "Update"},
      {value: "user.delete", label: "Delete"}
    ]
  },
  {
    value: "role",
    label: "Roles",
    children: [
      {value: "role.view", label: "View"},
      {value: "role.select", label: "Select"},
      {value: "role.create", label: "Create"},
      {value: "role.update", label: "Update"},
      {value: "role.delete", label: "Delete"}
    ]
  },
  {
    value: "group",
    label: "Groups",
    children: [
      {value: "group.view", label: "View"},
      {value: "group.select", label: "Select"},
      {value: "group.create", label: "Create"},
      {value: "group.update", label: "Update"},
      {value: "group.delete", label: "Delete"}
    ]
  }
]
