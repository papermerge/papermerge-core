import {MantineProvider} from "@mantine/core"
import {StrictMode} from "react"
import {createRoot} from "react-dom/client"
import {BrowserRouter, Route, Routes} from "react-router"
import AppShell from "./app/AppShell"
import "./index.css"
import ContextMenuPage from "./pages/ContextMenu"
import DownloadButton from "./pages/DownloadButton"
import ExtractPagesModalPage from "./pages/ExtractPagesModal"
import OnePage from "./pages/OnePage"
import OneThumbnail from "./pages/OneThumbnail"
import PageListPage from "./pages/PageList"
import PagesHaveChangedDialog from "./pages/PagesHaveChangedDialog"
import ThumbnailListPage from "./pages/ThumbnailList"
import TransferPagesModalPage from "./pages/TransferPagesModal"
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
            <Route path="page-list" element={<PageListPage />} />
            <Route path="thumbnail-list" element={<ThumbnailListPage />} />
            <Route
              path="pages-have-changed-dialog"
              element={<PagesHaveChangedDialog />}
            />
            <Route
              path="transfer-pages-modal"
              element={<TransferPagesModalPage />}
            />
            <Route
              path="extract-pages-modal"
              element={<ExtractPagesModalPage />}
            />
            <Route path="context-menu" element={<ContextMenuPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>
)
