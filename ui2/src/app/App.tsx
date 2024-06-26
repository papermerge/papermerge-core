import "@mantine/core/styles.css"
import {AppShell, Burger} from "@mantine/core"
import {Outlet} from "react-router-dom"
import {useSelector} from "react-redux"

import Sidebar from "@/components/Sidebar/Sidebar.tsx"
import Header from "@/components/Header/Header"
import {
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser.ts"
import classes from "./App.module.css"

function App() {
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <>
      <AppShell
        header={{height: 60}}
        navbar={{
          width: 200,
          breakpoint: "sm"
        }}
        padding="md"
      >
        <AppShell.Header>
          <Header />
        </AppShell.Header>

        <AppShell.Navbar className={classes.navbar}>
          <Sidebar />
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </>
  )
}

export default App
