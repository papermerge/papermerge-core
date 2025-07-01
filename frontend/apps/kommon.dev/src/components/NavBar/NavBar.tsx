import {Stack} from "@mantine/core"
import {NavLink} from "react-router"

export default function Navbar() {
  return (
    <nav>
      <Stack>
        <NavLink to="/" end>
          &lt;SubmitButton /&gt;
        </NavLink>
      </Stack>
    </nav>
  )
}
