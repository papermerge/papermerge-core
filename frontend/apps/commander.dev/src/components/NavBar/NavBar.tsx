import {Stack} from "@mantine/core"
import {NavLink} from "react-router"

export default function Navbar() {
  return (
    <nav>
      <Stack>
        <NavLink to="/" end>
          Index
        </NavLink>
        <NavLink to="/supported-files-info-modal" end>
          &lt; SupportedFilesInfoModal /&gt;
        </NavLink>
      </Stack>
    </nav>
  )
}
