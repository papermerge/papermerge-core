import "@mantine/core/styles.css";
import {AppShell, Burger} from "@mantine/core";
import {useDisclosure} from "@mantine/hooks";
import {Outlet} from "react-router-dom";
import {useSelector} from "react-redux";

import Sidebar from "@/components/Sidebar/Sidebar.tsx";
import Topbar from "@/components/Topbar/Topbar.tsx";
import {
  selectCurrentUserError,
  selectCurrentUserStatus
} from "@/slices/currentUser.ts";
import "./App.css";
import {ColorSchemeToggle} from "@/components/ColorSchemeToggle/ColorSchemeToggle";

function App() {
  const status = useSelector(selectCurrentUserStatus);
  const error = useSelector(selectCurrentUserError);
  const [opened, {toggle}] = useDisclosure();

  if (status == "failed") {
    return <>{error}</>;
  }

  return (
    <>
      <AppShell
        header={{height: 60}}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: {mobile: !opened}
        }}
        padding="md"
      >
        <AppShell.Header>
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <div>Logo</div>
          <Topbar />
          <ColorSchemeToggle />
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <Sidebar />
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </>
  );
}

export default App;
