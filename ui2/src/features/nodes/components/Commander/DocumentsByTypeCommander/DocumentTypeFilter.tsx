import {Select} from "@mantine/core"

export default function DocumentTypeFilter() {
  return (
    <Select
      searchable
      placeholder="Pick Document Type"
      data={["React", "Angular", "Vue", "Svelte"]}
    />
  )
}
