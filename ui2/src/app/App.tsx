import {useEffect, useRef} from "react"
import "@mantine/core/styles.css"
import {AppShell} from "@mantine/core"
import {useViewportSize} from "@mantine/hooks"
import {Outlet, useNavigate} from "react-router-dom"
import {useSelector, useDispatch} from "react-redux"

import NavBar from "@/components/NavBar"
import Header from "@/components/Header/Header"
import {
  selectCurrentUserError,
  selectCurrentUserStatus,
  selectCurrentUser
} from "@/slices/currentUser"
import {updateOutlet} from "@/slices/sizes"

import "./App.css"
import {selectNavBarWidth} from "@/slices/navBar"
import Uploader from "@/components/Uploader"

function App() {
  const {height, width} = useViewportSize()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)
  const navBarWidth = useSelector(selectNavBarWidth)
  const user = useSelector(selectCurrentUser)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status == "succeeded" && user) {
      navigate(`/home/${user.home_folder_id}`)
    }
  }, [status])

  useEffect(() => {
    if (ref?.current) {
      let value = 0
      const styles = window.getComputedStyle(ref?.current)
      value = parseInt(styles.marginTop)
      value += parseInt(styles.paddingTop)
      dispatch(updateOutlet(value))
    }
  }, [width, height])

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

        <AppShell.Main ref={ref}>
          <Outlet />
          <Uploader />
        </AppShell.Main>
      </AppShell>
    </>
  )
}

export default App
