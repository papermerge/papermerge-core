function Topbar() {
  const username = import.meta.env.VITE_USERNAME

  return (
    <>
      <ul className="topbar">
        <li>{username}</li>
      </ul>
    </>
  )
}

export default Topbar
