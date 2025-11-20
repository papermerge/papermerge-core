import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
import {useSelector} from "react-redux"
import {Outlet} from "react-router-dom"

import Header from "@/components/Header/Header"
import NavBar from "@/components/NavBar"
import Uploader from "@/components/Uploader"
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
      <div className="header">
        <Header />
      </div>
      <div className="container">
        <div className="nav-sidebar">
          <NavBar />
        </div>
        <main className="main-content">
          <Outlet />
        </main>
        <Uploader />
      </div>
    </>
  )
}

export default App
