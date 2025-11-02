import {Group, useMantineTheme} from "@mantine/core"
import {useState} from "react"
import logoURL from "/logo_transparent_bg.svg"

import classes from "./Header.module.css"

import Search from "@/features/search/components/TokenSeachInput"
import SidebarToggle from "./SidebarToggle"
import UserMenu from "./UserMenu"

function Header() {
  const theme = useMantineTheme()
  const [isSearchFocused, setIsSearchFocused] = useState(false)

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
          <img src={logoURL} width={"30px"} />
        </Group>
        <div
          className={`${classes.searchWrapper} ${isSearchFocused ? classes.searchWrapperExpanded : ""}`}
        >
          <Search onFocusChange={setIsSearchFocused} />
        </div>
        <Group>
          <UserMenu />
        </Group>
      </div>
    </header>
  )
}

export default Header
