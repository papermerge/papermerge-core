import {Autocomplete, rem} from "@mantine/core"
import {IconSearch} from "@tabler/icons-react"

export default function Search() {
  return (
    <Autocomplete
      placeholder="Search"
      leftSection={
        <IconSearch style={{width: rem(16), height: rem(16)}} stroke={1.5} />
      }
      data={[
        "billing.pdf",
        "anmeldung.pdf",
        "tags:important",
        "ciur AND tags:important",
        "My Documents",
        "Clients",
        "brother_007556.pdf"
      ]}
      visibleFrom="xs"
    />
  )
}
