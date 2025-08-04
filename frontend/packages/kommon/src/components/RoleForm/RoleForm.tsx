import {TextInput, Tree, Stack} from "@mantine/core"
import {IconChevronDown} from "@tabler/icons-react"
import {Checkbox, Group, RenderTreeNodePayload} from "@mantine/core"

interface Args {
  readOnly?: boolean
  txt?: {
    name: string
  }
}

const renderTreeNode = ({
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
        onClick={() =>
          !checked ? tree.checkNode(node.value) : tree.uncheckNode(node.value)
        }
      />

      <Group gap={5} onClick={() => tree.toggleExpanded(node.value)}>
        <span>{node.label}</span>

        {hasChildren && (
          <IconChevronDown
            size={14}
            style={{transform: expanded ? "rotate(180deg)" : "rotate(0deg)"}}
          />
        )}
      </Group>
    </Group>
  )
}

export default function RoleForm({txt, readOnly = false}: Args) {
  const data = [
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
        {value: "documents.delete", label: "Delete"}
      ]
    }
  ]

  return (
    <Stack>
      <TextInput readOnly={readOnly} label={txt?.name || "Name"} />
      <Tree
        data={data}
        levelOffset={40}
        expandOnClick={false}
        renderNode={renderTreeNode}
      />
    </Stack>
  )
}
