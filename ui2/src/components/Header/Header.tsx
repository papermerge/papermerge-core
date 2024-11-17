import {Group, useMantineTheme} from "@mantine/core"

import {ColorSchemeToggle} from "@/components/ColorSchemeToggle/ColorSchemeToggle"
import classes from "./Header.module.css"

import Search from "./Search"
import SidebarToggle from "./SidebarToggle"
import UserMenu from "./UserMenu"

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
          <img src="/public/logo_transparent_bg.png" width={"30px"} />
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
