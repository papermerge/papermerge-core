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
import type {
  I18NCheckButton,
  I18NCollapseButton,
  I18NPermissionTree
} from "./types"

interface Args {
  readOnly?: boolean
  initialCheckedState: string[]
  name?: string
  isLoading: boolean
  txt?: {
    name: string
    permissionTree: I18NPermissionTree
    collapseButton: I18NCollapseButton
    checkButton: I18NCheckButton
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
  initialCheckedState,
  isLoading,
  readOnly = false,
  withScrollArea = true,
  scrollAreaHeight = 480
}: Args) {
  const data = useMemo(() => getPermissionTree(txt?.permissionTree), [])

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
            label={txt?.name || "Name"}
          />
          <Group>
            <CollapseToggle txt={txt?.collapseButton} tree={tree} />
            {!readOnly && <CheckAllToggle txt={txt?.checkButton} tree={tree} />}
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

function getPermissionTree(txt?: I18NPermissionTree) {
  const PERMISSIONS_TREE = [
    {
      value: "folder",
      label: txt?.folders || "Folders",
      children: [
        {value: "folder.view", label: txt?.view || "View"},
        {value: "folder.create", label: txt?.create || "Create"},
        {value: "folder.update", label: txt?.update || "Update"},
        {value: "folder.move", label: txt?.move || "Move"},
        {value: "folder.delete", label: txt?.delete || "Delete"}
      ]
    },
    {
      value: "document",
      label: txt?.documents || "Documents",
      children: [
        {
          value: "document.download",
          label: txt?.download || "Download",
          children: [
            {
              value: "document.download.all_versions",
              label: txt?.all_versions || "All versions"
            },
            {
              value: "document.download.last_version_only",
              label: txt?.only_last_version || "Only last version"
            }
          ]
        },
        {value: "document.upload", label: txt?.upload || "Upload"},
        {value: "document.view", label: txt?.view || "View"},
        {
          value: "document.update",
          label: txt?.update || "Update",
          children: [
            {value: "document.update.title", label: txt?.title || "Title"},
            {
              value: "document.update.custom_fields",
              label: txt?.custom_fields || "Custom Fields"
            },
            {value: "document.update.tags", label: txt?.tags || "Tags"},
            {
              value: "document.update.document_type",
              label: txt?.category || "Category"
            }
          ]
        },
        {value: "document.move", label: txt?.move || "Move"},
        {value: "document.delete", label: txt?.delete || "Delete"},
        {
          value: "document.page",
          label: txt?.page_management || "Page Management",
          children: [
            {value: "document.page.extract", label: txt?.extract || "Extract"},
            {value: "document.page.move", label: txt?.move || "Move"},
            {value: "document.page.rotate", label: txt?.rotate || "Rotate"},
            {value: "document.page.reorder", label: txt?.reorder || "Reorder"},
            {value: "document.page.delete", label: txt?.delete || "Delete"}
          ]
        }
      ]
    },
    {
      value: "tag",
      label: txt?.tags || "Tags",
      children: [
        {value: "tag.view", label: txt?.view || "View"},
        {value: "tag.select", label: txt?.select || "Select "},
        {value: "tag.create", label: txt?.create || "Create"},
        {value: "tag.update", label: txt?.update || "Update"},
        {value: "tag.delete", label: txt?.delete || "Delete"}
      ]
    },
    {
      value: "custom_field",
      label: txt?.custom_fields || "Custom Fields",
      children: [
        {value: "custom_field.view", label: txt?.view || "View"},
        {value: "custom_field.create", label: txt?.create || "Create"},
        {value: "custom_field.update", label: txt?.update || "Update"},
        {value: "custom_field.delete", label: txt?.delete || "Delete"}
      ]
    },
    {
      value: "document_type",
      label: txt?.categories || "Categories",
      children: [
        {value: "document_type.view", label: txt?.view || "View"},
        {value: "document_type.select", label: txt?.select || "Select"},
        {value: "document_type.create", label: txt?.create || "Create"},
        {value: "document_type.update", label: txt?.update || "Update"},
        {value: "document_type.delete", label: txt?.delete || "Delete"}
      ]
    },
    {
      value: "shared_node",
      label: txt?.shares || "Shares",
      children: [
        {value: "shared_node.view", label: txt?.view || "View"},
        {value: "shared_node.create", label: txt?.create || "Create"},
        {value: "shared_node.update", label: txt?.update || "Update"},
        {value: "shared_node.delete", label: txt?.delete || "Delete"}
      ]
    },
    {
      value: "user",
      label: txt?.users || "Users",
      children: [
        {value: "user.view", label: txt?.view || "View"},
        {value: "user.select", label: txt?.select || "Select"},
        {value: "user.create", label: txt?.create || "Create"},
        {value: "user.update", label: txt?.update || "Update"},
        {value: "user.delete", label: txt?.delete || "Delete"}
      ]
    },
    {
      value: "role",
      label: txt?.roles || "Roles",
      children: [
        {value: "role.view", label: txt?.view || "View"},
        {value: "role.select", label: txt?.select || "Select"},
        {value: "role.create", label: txt?.create || "Create"},
        {value: "role.update", label: txt?.update || "Update"},
        {value: "role.delete", label: txt?.delete || "Delete"}
      ]
    },
    {
      value: "group",
      label: txt?.groups || "Groups",
      children: [
        {value: "group.view", label: txt?.view || "View"},
        {value: "group.select", label: txt?.select || "Select"},
        {value: "group.create", label: txt?.create || "Create"},
        {value: "group.update", label: txt?.update || "Update"},
        {value: "group.delete", label: txt?.delete || "Delete"}
      ]
    }
  ]
  return PERMISSIONS_TREE
}

const PERMISSION_DEPENDENCIES = {
  folder: [
    "document.view",
    "document.move",
    "document.delete",
    "document.update.title"
  ],
  "folder.view": ["document.view"],
  "folder.move": ["document.move"],
  "folder.delete": ["document.delete"],
  "folder.update": ["document.update.title"],
  document: [
    "folder.view",
    "folder.create",
    "folder.update",
    "folder.delete",
    "folder.move"
  ],
  "document.view": ["tag.select", "folder.view"],
  "document.move": ["folder.move"],
  "document.delete": ["folder.delete"],
  "document.update.title": ["folder.update"],
  "document.update.tags": ["tag.select"],
  "document.update.document_type": ["document_type.select"],
  shared_node: ["user.select", "group.select", "role.select"],
  "shared_node.create": ["user.select", "group.select", "role.select"],
  "shared_node.update": ["user.select", "group.select", "role.select"],
  "tag.select": ["document.view", "folder.view"],
  tag: ["document.view", "folder.view"]
}

interface CollapseToggleArgs {
  tree: UseTreeReturnType
  txt?: I18NCollapseButton
}

function CollapseToggle({tree, txt}: CollapseToggleArgs) {
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
        {txt?.collapseAll || "Collapse All"}
      </Button>
    )
  }

  return (
    <Button variant="light" size={"xs"} onClick={handleClick}>
      {txt?.expandAll || "Expand All"}
    </Button>
  )
}

interface CheckAllToggleArgs {
  tree: UseTreeReturnType
  txt?: I18NCheckButton
}

function CheckAllToggle({tree, txt}: CheckAllToggleArgs) {
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
        {txt?.uncheckAll || "Uncheck All"}
      </Button>
    )
  }

  return (
    <Button variant="light" size={"xs"} onClick={handleClick}>
      {txt?.checkAll || "Check All"}
    </Button>
  )
}
