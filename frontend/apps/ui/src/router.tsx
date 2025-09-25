import {createBrowserRouter} from "react-router-dom"

import App from "@/app/App.tsx"
import Folder, {loader as folderLoader} from "@/pages/Folder"
import Home, {loader as homeLoader} from "@/pages/Home"
import Inbox, {loader as inboxLoader} from "@/pages/Inbox"

import {
  CustomFieldDetails,
  CustomFieldsList
} from "@/features/custom-fields/pages"
import {
  DocumentTypeDetails,
  DocumentTypesList
} from "@/features/document-types/pages"
import {GroupDetails, GroupsList} from "@/features/groups/pages"
import CategoryListView, {
  loader as categoryLoader
} from "@/features/nodes/pages/CategoryListView"
import {RoleDetails, RolesList} from "@/features/roles/pages"
import SharedDocumentView, {
  loader as sharedDocumentLoader
} from "@/features/shared_nodes/pages/SharedDocumentView"
import SharedFolderView, {
  loader as sharedFolderLoader
} from "@/features/shared_nodes/pages/SharedFolderView"
import SharedNodesListView, {
  loader as sharedNodesLoader
} from "@/features/shared_nodes/pages/SharedNodesListView"
import {TagDetails, TagsList} from "@/features/tags/pages"
import {UserDetails, UsersList} from "@/features/users/pages"
import Document from "@/pages/Document"
import {AuditLogDetails, AuditLogsList} from "./features/audit/pages"

import {AccessForbidden, NotFound, UnprocessableContent} from "@/pages/errors"

import {loader as auditLogDetailsLoader} from "@/features/audit/pages/Details"
import {loader as auditLogsListLoader} from "@/features/audit/pages/List"
import {loader as customFieldsLoader} from "@/features/custom-fields/pages/Details"
import {loader as customFieldsListLoader} from "@/features/custom-fields/pages/List"
import {loader as groupsDetailsLoader} from "@/features/groups/pages/Details"
import {loader as groupsListLoader} from "@/features/groups/pages/List"
import {loader as rolesDetailsLoader} from "@/features/roles/pages/Details"
import {loader as rolesListLoader} from "@/features/roles/pages/List"
import {loader as usersDetailsLoader} from "@/features/users/pages/Details"
import {loader as usersListLoader} from "@/features/users/pages/List"
import {loader as documentLoader} from "@/pages/Document"

import ErrorPage from "@/pages/Error.tsx"
import {
  ERRORS_403_ACCESS_FORBIDDEN,
  ERRORS_404_RESOURCE_NOT_FOUND,
  ERRORS_422_UNPROCESSABLE_CONTENT
} from "./cconstants"

const router = createBrowserRouter([
  {
    path: "/home",
    element: <App />
  },
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/home/:folderId",
        element: <Home />,
        loader: homeLoader
      },
      {
        path: "/inbox/:folderId",
        element: <Inbox />,
        loader: inboxLoader
      },
      {
        path: "/folder/:folderId",
        element: <Folder />,
        loader: folderLoader
      },
      {
        path: "/document/:documentId",
        element: <Document />,
        loader: documentLoader
      },
      {
        path: "/category",
        element: <CategoryListView />,
        loader: categoryLoader
      },
      {
        path: "/category/:categoryId",
        element: <CategoryListView />,
        loader: categoryLoader
      },
      {
        path: "/shared",
        element: <SharedNodesListView />,
        loader: sharedNodesLoader
      },
      {
        path: "/shared/folder/:folderId",
        element: <SharedFolderView />,
        loader: sharedFolderLoader
      },
      {
        path: "/shared/document/:documentId",
        element: <SharedDocumentView />,
        loader: sharedDocumentLoader
      },
      {
        path: "/tags",
        element: <TagsList />
      },
      {
        path: "/tags/:tagId",
        element: <TagDetails />
      },
      {
        path: "/custom-fields/",
        element: <CustomFieldsList />,
        loader: customFieldsListLoader
      },
      {
        path: "/custom-fields/:id",
        element: <CustomFieldDetails />,
        loader: customFieldsLoader
      },
      {
        path: "/document-types/",
        element: <DocumentTypesList />
      },
      {
        path: "/document-types/:documentTypeID",
        element: <DocumentTypeDetails />
      },
      {
        path: "/groups",
        element: <GroupsList />,
        loader: groupsListLoader
      },
      {
        path: "/groups/:id",
        element: <GroupDetails />,
        loader: groupsDetailsLoader
      },
      {
        path: "/roles",
        element: <RolesList />,
        loader: rolesListLoader
      },
      {
        path: "/roles/:id",
        element: <RoleDetails />,
        loader: rolesDetailsLoader
      },
      {
        path: "/users",
        element: <UsersList />,
        loader: usersListLoader
      },
      {
        path: "/users/:id",
        element: <UserDetails />,
        loader: usersDetailsLoader
      },
      {
        path: "/audit-logs",
        element: <AuditLogsList />,
        loader: auditLogsListLoader
      },
      {
        path: "/audit-logs/:id",
        element: <AuditLogDetails />,
        loader: auditLogDetailsLoader
      },
      {
        path: ERRORS_403_ACCESS_FORBIDDEN,
        element: <AccessForbidden />
      },
      {
        path: ERRORS_404_RESOURCE_NOT_FOUND,
        element: <NotFound />
      },
      {
        path: ERRORS_422_UNPROCESSABLE_CONTENT,
        element: <UnprocessableContent />
      }
    ]
  }
])

export default router
