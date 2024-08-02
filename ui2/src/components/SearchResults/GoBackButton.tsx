import {Tooltip, ActionIcon} from "@mantine/core"
import {IconArrowLeft} from "@tabler/icons-react"
import {useNavigate} from "react-router-dom"
import {selectCurrentUser} from "@/slices/currentUser"
import {useSelector} from "react-redux"
import type {User} from "@/types"

export default function GoBackButton() {
  const user = useSelector(selectCurrentUser) as User
  const navigate = useNavigate()

  const onClick = () => {
    navigate(`/home/${user.home_folder_id}`)
  }

  return (
    <Tooltip label="Go back to home folder" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onClick}>
        <IconArrowLeft stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
