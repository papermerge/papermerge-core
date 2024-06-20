import { NavLink } from "react-router-dom"
import "./Sidebar.css";

function Sidebar() {
  return (
    <>
      <ul className="sidebar">
        Sidebar
        <li><NavLink to="/">Home</NavLink></li>
        <li><NavLink to="/inbox">Inbox</NavLink></li>
        <li><NavLink to="/tags">Tags</NavLink></li>
        <li><NavLink to="/groups">Groups</NavLink></li>
        <li><NavLink to="/users">Users</NavLink></li>
      </ul>
    </>
  )
}

export default Sidebar
