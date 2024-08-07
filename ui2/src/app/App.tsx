import {useEffect} from "react"
import "@mantine/core/styles.css"
import {AppShell} from "@mantine/core"
import {Outlet, useNavigate} from "react-router-dom"
import {useSelector} from "react-redux"

import NavBar from "@/components/NavBar"
import Header from "@/components/Header/Header"
import {
  selectCurrentUserError,
  selectCurrentUserStatus,
  selectCurrentUser
} from "@/slices/currentUser"

import "./App.css"
import {selectNavBarWidth} from "@/slices/navBar"
import Uploader from "@/components/Uploader"

function App() {
  const navigate = useNavigate()
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const navBarWidth = useSelector(selectNavBarWidth)
  const user = useSelector(selectCurrentUser)

  useEffect(() => {
    if (status == "succeeded" && user) {
      navigate(`/home/${user.home_folder_id}`)
    }
  }, [status])

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <>
      <AppShell
        header={{height: 60}}
        navbar={{
          width: navBarWidth,
          breakpoint: 0
        }}
      >
        <AppShell.Header>
          <Header />
        </AppShell.Header>

        <AppShell.Navbar>
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
