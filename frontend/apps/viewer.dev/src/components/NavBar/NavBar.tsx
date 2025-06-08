import {Stack} from "@mantine/core"
import {NavLink} from "react-router"

export default function Navbar() {
  return (
    <nav>
      <Stack>
        <NavLink to="/" end>
          One &lt;Page /&gt;
        </NavLink>
        <NavLink to="/two-pages" end>
          Two &lt;Page /&gt;
        </NavLink>
      </Stack>
    </nav>
  )
}
