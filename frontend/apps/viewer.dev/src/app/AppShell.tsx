import {AppShell} from "@mantine/core"

import {createTheme} from "@mantine/core"
import "@mantine/core/styles.css"
import {Outlet} from "react-router"
import NavBar from "../components/NavBar"

export const theme = createTheme({})

export const metadata = {
  title: "Viewer Dev",
  description: "Viewer Dev"
}

export default function App() {
  return (
    <AppShell
      header={{height: 60}}
      navbar={{
        width: 300,
        breakpoint: "sm"
      }}
      padding="md"
    >
      <AppShell.Header>Viewer Dev</AppShell.Header>
      <AppShell.Navbar p="md">
        <NavBar />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
