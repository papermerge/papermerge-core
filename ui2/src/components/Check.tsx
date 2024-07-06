import {IconCheck, IconX} from "@tabler/icons-react"

export default function Check({check}: {check: boolean}) {
  if (check) {
    return <IconCheck color="green" />
  }

  return <IconX color="red" />
}
