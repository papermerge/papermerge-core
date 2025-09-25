import {OwnedBy} from "@/types"
import {IconUser, IconUsersGroup} from "@tabler/icons-react"

export default function OwnerIcon({owner}: {owner?: OwnedBy}) {
  if (!owner) {
    return <></>
  }

  if (owner.type == "user") {
    return <IconUser size={18} />
  }

  if (owner.type == "group") {
    return <IconUsersGroup size={18} />
  }
}
