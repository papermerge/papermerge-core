import {Stack} from "@mantine/core"
import {NavLink} from "react-router"

export default function Navbar() {
  return (
    <nav>
      <Stack>
        <NavLink to="/" end>
          One Page
        </NavLink>
        <NavLink to="/two-pages" end>
          Two Pages
        </NavLink>
      </Stack>
    </nav>
  )
}
