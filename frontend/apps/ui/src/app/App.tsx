import "@mantine/core/styles.css"
import "@mantine/dates/styles.css"
import {useEffect} from "react"
import {useSelector} from "react-redux"
import {Outlet, useLocation, useNavigate} from "react-router-dom"

import Header from "@/components/Header/Header"
import NavBar from "@/components/NavBar"
import {
  selectCurrentUser,
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser"

import Uploader from "@/components/Uploader"
import "./App.css"

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const user = useSelector(selectCurrentUser)

  useEffect(() => {
    /* notice *EXACT match* of the root route.
      Without it, user will always be redirected to home folder,
      even when he/she opens a document via direct url pasting in browser */
    if (status == "succeeded" && user && location.pathname == "/") {
      /*
      (1)
      This code addresses following problem: what happens when user lands
      on root route (i.e. "/")?
      Without any code change - the app shell will be render an empty outlet!!!
      What we need though is to render "home" folder by default.
    */
      navigate(`/home/${user.home_folder_id}`)
    }
    if (status == "succeeded" && user && location.pathname == "/home") {
      // see (1)
      navigate(`/home/${user.home_folder_id}`)
    }
    if (status == "succeeded" && user && location.pathname == "/home/") {
      // see (2)
      navigate(`/home/${user.home_folder_id}`)
    }
  }, [status])

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
