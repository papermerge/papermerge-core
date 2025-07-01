import {AppShell} from "@mantine/core"

import "@mantine/core/styles.css"
import {Outlet} from "react-router"
import NavBar from "../components/NavBar"

export const metadata = {
  title: "Kommon Dev",
  description: "Kommon Dev"
}

export default function App() {
  return (
    <AppShell
      header={{height: 40}}
      navbar={{
        width: 180,
        breakpoint: "sm"
      }}
      p="md"
    >
      <AppShell.Header>Kommon Dev</AppShell.Header>
      <AppShell.Navbar p="md">
        <NavBar />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}
