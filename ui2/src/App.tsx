import { Outlet } from "react-router-dom"
import Sidebar from "./components/Sidebar/Sidebar"
import Topbar from "./components/Topbar/Topbar"
import "./App.css";
import { store } from './store.ts'
import { fetchCurrentUser } from './slices/currentUser.ts'


function App() {
  
  store.dispatch(fetchCurrentUser())

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
