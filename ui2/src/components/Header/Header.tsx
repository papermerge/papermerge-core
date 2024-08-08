import {Group, useMantineTheme} from "@mantine/core"

import {ColorSchemeToggle} from "@/components/ColorSchemeToggle/ColorSchemeToggle"
import classes from "./Header.module.css"

import SidebarToggle from "./SidebarToggle"
import UserMenu from "./UserMenu"
import Search from "./Search"

function Header() {
  const theme = useMantineTheme()

  return (
    <header
      className="top-header"
      style={{
        backgroundColor: theme.colors.pmg[9],
        color: theme.colors.pmg[0]
      }}
    >
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

export default Header
