import CopyButton from "@/components/CopyButton"
import {TextInput} from "@mantine/core"

import type {GroupDetails} from "@/types"

type Args = {
  group: GroupDetails | null
}

export default function GroupModal({group}: Args) {
  return (
    <div>
      <TextInput
        value={group?.name || ""}
        onChange={() => {}}
        label="Name"
        rightSection={<CopyButton value={group?.name || ""} />}
      />
    </div>
  )
}
