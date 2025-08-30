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
    <UnstyledButton
      onClick={() => onClick()}
      style={{
        outline: "none",
        boxShadow: "none",
        "&:focus": {
          outline: "none",
          boxShadow: "none"
        },
        "&:active": {
          outline: "none",
          boxShadow: "none"
        }
      }}
    >
      <IconMenu2 />
    </UnstyledButton>
  )
}
