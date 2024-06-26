import {useSelector} from "react-redux"
import {Group, Burger, Autocomplete, rem} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconSearch} from "@tabler/icons-react"
import {
  selectCurrentUser,
  selectCurrentUserStatus,
  selectCurrentUserError
} from "@/slices/currentUser.ts"
import {ColorSchemeToggle} from "@/components/ColorSchemeToggle/ColorSchemeToggle"
import classes from "./Header.module.css"

import type {User} from "@/types.ts"
import SidebarToggle from "./SidebarToggle"

function Topbar() {
  const user = useSelector(selectCurrentUser) as User
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)

  if (status == "loading") {
    return <>Loading...</>
  }

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Group>
          <SidebarToggle />
          Papermerge DMS
        </Group>
        <Group grow className={classes.search}>
          <Autocomplete
            placeholder="Search"
            leftSection={
              <IconSearch
                style={{width: rem(16), height: rem(16)}}
                stroke={1.5}
              />
            }
            data={[
              "billing.pdf",
              "anmeldung.pdf",
              "tags:important",
              "ciur AND tags:important",
              "My Documents",
              "Clients",
              "brother_007556.pdf"
            ]}
            visibleFrom="xs"
          />
        </Group>
        <Group>
          <ColorSchemeToggle />
          <div>
            <ul className="topbar">
              <li>
                {user.username} / {user.email}
              </li>
            </ul>
          </div>
        </Group>
      </div>
    </header>
  )
}

export default Topbar
