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
  txt?: {
    name: string
  }
  onPermissionsChange?: (checkedPermissions: CheckedNodeStatus[]) => void
}

export default function RoleForm({
  txt,
  onPermissionsChange,
  readOnly = false
}: Args) {
  const data = useMemo(() => PERMISSIONS_TREE, [])

  const tree = useTree({
    initialCheckedState: ["folders.view", "users.view"],
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
    value: "folders",
    label: "Folders",
    children: [
      {value: "folders.view", label: "View"},
      {value: "folders.create", label: "Create"},
      {value: "folders.update", label: "Update"},
      {value: "folders.move", label: "Move"},
      {value: "folders.delete", label: "Delete"}
    ]
  },
  {
    value: "documents",
    label: "Documents",
    children: [
      {
        value: "documents.download",
        label: "Download",
        children: [
          {
            value: "documents.download.all_versions",
            label: "All versions"
          },
          {
            value: "documents.download.last_version_only",
            label: "Only last version"
          }
        ]
      },
      {value: "documents.upload", label: "Upload"},
      {value: "documents.view", label: "View"},
      {
        value: "documents.update",
        label: "Update",
        children: [
          {value: "documents.update.title", label: "Title"},
          {value: "documents.update.cf", label: "Custom Fields"},
          {value: "documents.update.tags", label: "Tags"}
        ]
      },
      {value: "documents.move", label: "Move"},
      {value: "documents.delete", label: "Delete"},
      {
        value: "documents.pages",
        label: "Page Management",
        children: [
          {value: "documents.pages.extract", label: "Extract"},
          {value: "documents.pages.rotate", label: "Rotate"},
          {value: "documents.pages.reorder", label: "Reorder"},
          {value: "documents.pages.delete", label: "Delete"}
        ]
      }
    ]
  },
  {
    value: "tags",
    label: "Tags",
    children: [
      {value: "tags.view", label: "View"},
      {value: "tags.select", label: "Select "},
      {value: "tags.create", label: "Create"},
      {value: "tags.update", label: "Update"},
      {value: "tags.delete", label: "Delete"}
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
    value: "categories",
    label: "Categories",
    children: [
      {value: "categories.view", label: "View"},
      {value: "categories.create", label: "Create"},
      {value: "categories.update", label: "Update"},
      {value: "categories.delete", label: "Delete"}
    ]
  },
  {
    value: "shared_nodes",
    label: "Shares",
    children: [
      {value: "shared_nodes.view", label: "View"},
      {value: "shared_nodes.create", label: "Create"},
      {value: "shared_nodes.update", label: "Update"},
      {value: "shared_nodes.delete", label: "Delete"}
    ]
  },
  {
    value: "users",
    label: "Users",
    children: [
      {value: "users.view", label: "View"},
      {value: "users.select", label: "Select"},
      {value: "users.create", label: "Create"},
      {value: "users.update", label: "Update"},
      {value: "users.delete", label: "Delete"}
    ]
  },
  {
    value: "roles",
    label: "Roles",
    children: [
      {value: "roles.view", label: "View"},
      {value: "roles.select", label: "Select"},
      {value: "roles.create", label: "Create"},
      {value: "roles.update", label: "Update"},
      {value: "roles.delete", label: "Delete"}
    ]
  },
  {
    value: "groups",
    label: "Groups",
    children: [
      {value: "groups.view", label: "View"},
      {value: "groups.select", label: "Select"},
      {value: "groups.create", label: "Create"},
      {value: "groups.update", label: "Update"},
      {value: "groups.delete", label: "Delete"}
    ]
  }
]
