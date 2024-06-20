import { Outlet } from "react-router-dom"
import Sidebar from "./components/Sidebar/Sidebar"
import Topbar from "./components/Topbar/Topbar"
import "./App.css";

function App() {
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
