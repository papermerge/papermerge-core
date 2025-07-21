import {Stack} from "@mantine/core"
import {NavLink} from "react-router"

export default function Navbar() {
  return (
    <nav>
      <Stack>
        <NavLink to="/" end>
          &lt;SubmitButton /&gt;
        </NavLink>
        <NavLink to="/edit-node-modal" end>
          &lt;EditNodeTitleModal /&gt;
        </NavLink>
      </Stack>
    </nav>
  )
}
