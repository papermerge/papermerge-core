import { Outlet } from "react-router-dom"
import { useSelector } from "react-redux";
import Sidebar from "../components/Sidebar/Sidebar.tsx"
import Topbar from "../components/Topbar/Topbar.tsx"
import "./App.css";
import {selectCurrentUserError, selectCurrentUserStatus } from '@/slices/currentUser.ts'


function App() {
  const status = useSelector(selectCurrentUserStatus)
  const error = useSelector(selectCurrentUserError)

  if (status == 'failed') {
    return <>{error}</>
  }

  return (
    <>
      <Topbar />
      <Sidebar />
      <div>
        <Outlet />
      </div>
    </>
  )
}

export default App
