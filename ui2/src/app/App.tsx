import "@mantine/core/styles.css"
import {AppShell} from "@mantine/core"
import {Outlet} from "react-router-dom"
import {useSelector} from "react-redux"

import NavBar from "@/components/NavBar"
import Header from "@/components/Header/Header"
import {
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser"

import classes from "./App.module.css"
import {selectNavBarWidth} from "@/slices/navBar"
import Uploader from "@/components/Uploader"

function App() {
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const navBarWidth = useSelector(selectNavBarWidth)

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <>
      <AppShell
        header={{height: 60}}
        navbar={{
          width: navBarWidth,
          breakpoint: "sm"
        }}
        padding="md"
      >
        <AppShell.Header className={classes.header}>
          <Header />
        </AppShell.Header>

        <AppShell.Navbar className={classes.navbar}>
          <NavBar />
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
          <Uploader />
        </AppShell.Main>
      </AppShell>
    </>
  )
}

export default App
