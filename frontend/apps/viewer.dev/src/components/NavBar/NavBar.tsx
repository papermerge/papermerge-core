import {Stack} from "@mantine/core"
import {NavLink} from "react-router"

export default function Navbar() {
  return (
    <nav>
      <Stack>
        <NavLink to="/" end>
          One &lt;Page /&gt;
        </NavLink>
        <NavLink to="/two-pages" end>
          Two &lt;Page /&gt;
        </NavLink>
        <NavLink to="/one-thumbnail" end>
          One &lt;Thumbnail /&gt;
        </NavLink>
        <NavLink to="/download-button" end>
          &lt;DownloadButton /&gt;
        </NavLink>
        <NavLink to="/page-list" end>
          &lt;PageList /&gt;
        </NavLink>
        <NavLink to="/thumbnail-list" end>
          &lt;ThumbnailList /&gt;
        </NavLink>
        <NavLink to="/pages-have-changed-dialog" end>
          &lt;PagesHaveChangedDialog /&gt;
        </NavLink>
        <NavLink to="/transfer-pages-modal" end>
          &lt;TransferPagesModal /&gt;
        </NavLink>
        <NavLink to="/extract-pages-modal" end>
          &lt;ExtractPagesModal /&gt;
        </NavLink>
        <NavLink to="/context-menu" end>
          &lt;ContextMenu /&gt;
        </NavLink>
      </Stack>
    </nav>
  )
}
