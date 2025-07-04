import {UnstyledButton} from "@mantine/core"
import {IconMenu2} from "@tabler/icons-react"
import {useDispatch} from "react-redux"

import {toggleNavBar} from "@/features/ui/uiSlice"

export default function SidebarToggle() {
  const dispatch = useDispatch()

  const onClick = () => {
    dispatch(toggleNavBar())
  }
  return (
    <UnstyledButton onClick={() => onClick()}>
      <IconMenu2 />
    </UnstyledButton>
  )
}
