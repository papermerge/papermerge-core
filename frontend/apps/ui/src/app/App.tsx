import {Box} from "@mantine/core"
import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
import {useSelector} from "react-redux"
import {Outlet} from "react-router-dom"

import Header from "@/components/Header/Header"
import NavBar from "@/components/NavBar"
import Uploader from "@/features/files/components/Uploader"
import {
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser"

import "./App.css"
import {useUILanguage, useUITheme} from "./hooks"

function App() {
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)

  useUILanguage()
  useUITheme()

  if (status == "failed") {
    return <>{error}</>
  }

  return (
    <>
      <Box className="header">
        <Header />
      </Box>
      <Box className="container">
        <Box className="nav-sidebar">
          <NavBar />
        </Box>
        <main className="main-content">
          <Outlet />
        </main>
        <Uploader />
      </Box>
    </>
  )
}

export default App
