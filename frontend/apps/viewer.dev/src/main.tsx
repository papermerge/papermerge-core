import {MantineProvider} from "@mantine/core"
import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import {BrowserRouter, Route, Routes} from "react-router"
import AppShell from "./app/AppShell"
import "./index.css"
import DownloadButton from "./pages/DownloadButton"
import OnePage from "./pages/OnePage"
import OneThumbnail from "./pages/OneThumbnail"
import TwoPages from "./pages/TwoPages"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<OnePage />} />
            <Route path="two-pages" element={<TwoPages />} />
            <Route path="one-thumbnail" element={<OneThumbnail />} />
            <Route path="download-button" element={<DownloadButton />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
)
