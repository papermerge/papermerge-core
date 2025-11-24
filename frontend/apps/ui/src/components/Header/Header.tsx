import {Group, useMantineTheme} from "@mantine/core"
import logoURL from "/logo_transparent_bg.svg"

import classes from "./Header.module.css"

import {useAppDispatch} from "@/app/hooks"
import {ClearNotificationsButton} from "@/features/notifications/components/ClearButton"
import Search from "@/features/search/components/Search"
import {setPanelComponent} from "@/features/ui/panelRegistry"
import UploadButton from "../../features/files/components/UploadButton"
import SidebarToggle from "./SidebarToggle"
import UserMenu from "./UserMenu"

function Header() {
  const theme = useMantineTheme()
  const dispatch = useAppDispatch()

  const onSearch = () => {
    dispatch(
      setPanelComponent({
        panelId: "main",
        component: "documentsListByCategory"
      })
    )
  }

  return (
    <header
      className="top-header"
      style={{
        backgroundColor: theme.colors.pmg[9],
        color: theme.colors.pmg[0]
      }}
    >
      <Group className={classes.inner}>
        <Group>
          <SidebarToggle />
          <img src={logoURL} width={"30px"} />
          <UploadButton />
        </Group>
        <Group className={classes.searchWrapper}>
          <Search onSearch={onSearch} />
        </Group>
        <Group>
          <ClearNotificationsButton />
          <UserMenu />
        </Group>
      </Group>
    </header>
  )
}

export default Header
