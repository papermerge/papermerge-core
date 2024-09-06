import {useDispatch} from "react-redux"
import {IconMenu2} from "@tabler/icons-react"
import {UnstyledButton} from "@mantine/core"

import {toggleNavBar} from "@/features/ui/uiSlice"

export default function SidebarToggle() {
  const dispatch = useDispatch()

  const onClick = () => {
    console.log("SidebarToggled")
    dispatch(toggleNavBar())
  }
  return (
    <UnstyledButton onClick={() => onClick()}>
      <IconMenu2 />
    </UnstyledButton>
  )
}
