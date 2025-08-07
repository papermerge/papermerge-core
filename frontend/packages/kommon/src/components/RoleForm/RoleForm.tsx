import {
  TextInput,
  Box,
  LoadingOverlay,
  Tree,
  useTree,
  Stack,
  CheckedNodeStatus,
  Button,
  UseTreeReturnType,
  ScrollArea
} from "@mantine/core"
import {IconChevronDown} from "@tabler/icons-react"
import {Checkbox, Group, RenderTreeNodePayload} from "@mantine/core"
import {useCallback, useMemo, useEffect, useState} from "react"

interface Args {
  readOnly?: boolean
  initialCheckedState: string[]
  name?: string
  nameFieldError?: string
  isLoading: boolean
  txt?: {
    name: string
  }
  onPermissionsChange?: (checkedPermissions: CheckedNodeStatus[]) => void
  onNameChange?: (value: string) => void
  withScrollArea?: boolean
  scrollAreaHeight?: number
}

// Define permission dependencies type
type PermissionDependencies = {
  [key: string]: string[]
}

export default function RoleForm({
  txt,
  onPermissionsChange,
  onNameChange,
  name,
  nameFieldError,
  initialCheckedState,
  isLoading,
  readOnly = false,
  withScrollArea = true,
  scrollAreaHeight = 480
}: Args) {
  const data = useMemo(() => PERMISSIONS_TREE, [])

  const onLocalNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.currentTarget.value
    if (onNameChange) {
      onNameChange(newValue)
    }
  }

  const permissionDependencies = useMemo(
    (): PermissionDependencies => PERMISSION_DEPENDENCIES,
    []
  )

  const getAllDependencies = useCallback(
    (permission: string, visited: Set<string> = new Set()): string[] => {
      if (visited.has(permission)) {
        return [] // Avoid circular dependencies
      }

      visited.add(permission)
      const dependencies = permissionDependencies[permission] || []
      const allDeps = [...dependencies]

      // Recursively get dependencies of dependencies
      dependencies.forEach(dep => {
        if (!visited.has(dep)) {
          allDeps.push(...getAllDependencies(dep, new Set(visited)))
        }
      })

      // Remove duplicates
      return [...new Set(allDeps)]
    },
    [permissionDependencies]
  )

  const tree = useTree({
    initialCheckedState: initialCheckedState
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

      const handleCheckboxClick = (): void => {
        if (readOnly) return

        if (!checked) {
          // When checking a permission, also check its dependencies
          tree.checkNode(node.value)
          const dependencies = getAllDependencies(node.value)
          dependencies.forEach(dep => tree.checkNode(dep))
        } else {
          // When unchecking a permission, also uncheck permissions that depend on it
          tree.uncheckNode(node.value)
          const dependents = getAllDependencies(node.value)
          dependents.forEach(dep => tree.uncheckNode(dep))
        }
      }

      return (
        <Group gap="xs" {...elementProps}>
          <Checkbox.Indicator
            checked={checked}
            indeterminate={indeterminate}
            onClick={handleCheckboxClick}
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
    [readOnly, getAllDependencies] // Fixed: Added missing dependencies
  )

  return (
    <>
      <Box pos="relative">
        <LoadingOverlay
          visible={isLoading}
          zIndex={1000}
          overlayProps={{radius: "sm", blur: 2}}
        />
        <Stack>
          <TextInput
            value={name}
            onChange={onLocalNameChange}
            readOnly={readOnly}
            error={nameFieldError}
            label={txt?.name || "Name"}
          />
          <Group>
            <CollapseToggle tree={tree} />
            {!readOnly && <CheckAllToggle tree={tree} />}
          </Group>
          {!withScrollArea && (
            <Tree
              data={data}
              tree={tree}
              levelOffset={40}
              expandOnClick={false}
              renderNode={renderTreeNode}
            />
          )}
          {withScrollArea && (
            <ScrollArea h={scrollAreaHeight}>
              <Tree
                data={data}
                tree={tree}
                levelOffset={40}
                expandOnClick={false}
                renderNode={renderTreeNode}
              />
            </ScrollArea>
          )}
        </Stack>
      </Box>
    </>
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
    value: "custom_field",
    label: "Custom Fields",
    children: [
      {value: "custom_field.view", label: "View"},
      {value: "custom_field.create", label: "Create"},
      {value: "custom_field.update", label: "Update"},
      {value: "custom_field.delete", label: "Delete"}
    ]
  },
  {
    value: "document_type",
    label: "Categories",
    children: [
      {value: "document_type.view", label: "View"},
      {value: "document_type.create", label: "Create"},
      {value: "document_type.update", label: "Update"},
      {value: "document_type.delete", label: "Delete"}
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

const PERMISSION_DEPENDENCIES = {
  folder: ["document.view"],
  document: ["folder.view"],
  "folder.view": ["document.view"],
  "document.view": ["tag.select", "folder.view"],
  "shared_node.create": ["user.select", "group.select", "role.select"],
  "shared_node.update": ["user.select", "group.select", "role.select"],
  "tag.select": ["document.view", "folder.view"],
  tag: ["document.view", "folder.view"]
}

interface CollapseToggleArgs {
  tree: UseTreeReturnType
}

function CollapseToggle({tree}: CollapseToggleArgs) {
  const [expanded, setExpanded] = useState<boolean>(false)

  const handleClick = () => {
    if (expanded) {
      tree.collapseAllNodes()
      setExpanded(false)
    } else {
      tree.expandAllNodes()
      setExpanded(true)
    }
  }

  if (expanded) {
    return (
      <Button variant="light" size={"xs"} onClick={handleClick}>
        Collapse All
      </Button>
    )
  }

  return (
    <Button variant="light" size={"xs"} onClick={handleClick}>
      Expand All
    </Button>
  )
}

interface CheckAllToggleArgs {
  tree: UseTreeReturnType
}

function CheckAllToggle({tree}: CheckAllToggleArgs) {
  const [allChecked, setAllChecked] = useState<boolean>(false)

  const handleClick = () => {
    if (allChecked) {
      tree.uncheckAllNodes()
      setAllChecked(false)
    } else {
      tree.checkAllNodes()
      setAllChecked(true)
    }
  }

  if (allChecked) {
    return (
      <Button variant="light" size={"xs"} onClick={handleClick}>
        Uncheck All
      </Button>
    )
  }

  return (
    <Button variant="light" size={"xs"} onClick={handleClick}>
      Check All
    </Button>
  )
}
