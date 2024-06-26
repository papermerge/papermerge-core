import {Group} from "@mantine/core"

import {ColorSchemeToggle} from "@/components/ColorSchemeToggle/ColorSchemeToggle"
import classes from "./Header.module.css"

import SidebarToggle from "./SidebarToggle"
import UserMenu from "./UserMenu"
import Search from "./Search"

function Topbar() {
  return (
    <header className={classes.header}>
      <div className={classes.inner}>
        <Group>
          <SidebarToggle />
          Papermerge DMS
        </Group>
        <Group grow className={classes.search}>
          <Search />
        </Group>
        <Group>
          <ColorSchemeToggle />
          <UserMenu />
        </Group>
      </div>
    </header>
  )
}

export default Topbar
