import { NavLink, Outlet } from "react-router-dom"

function App() {
  return (
    <>
      <ul>
        <li><NavLink to="/">Home</NavLink></li>
        <li><NavLink to="/inbox">Inbox</NavLink></li>
        <li><NavLink to="/tags">Tags</NavLink></li>
        <li><NavLink to="/groups">Groups</NavLink></li>
        <li><NavLink to="/users">Users</NavLink></li>
      </ul>
      <div>
        <Outlet />
      </div>
    </>
  )
}

export default App
