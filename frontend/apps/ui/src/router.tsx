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
import DocumentsByCategoryDetails from "@/features/documents-by-category/pages/Details"
import {GroupDetails, GroupsList} from "@/features/groups/pages"
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
import {MyPreferences} from "./features/preferences/components"

import {AccessForbidden, NotFound, UnprocessableContent} from "@/pages/errors"

import {loader as auditLogDetailsLoader} from "@/features/audit/pages/Details"
import {loader as auditLogsListLoader} from "@/features/audit/pages/List"
import {loader as customFieldsLoader} from "@/features/custom-fields/pages/Details"
import {loader as customFieldsListLoader} from "@/features/custom-fields/pages/List"
import {loader as documentTypeDetailsLoader} from "@/features/document-types/pages/Details"
import {loader as documentTypesListLoader} from "@/features/document-types/pages/List"
import {loader as documentsByCategoryDetailsLoader} from "@/features/documents-by-category/pages/Details"
import {loader as documentsByCategoryListLoader} from "@/features/documents-by-category/pages/List"
import {loader as groupsDetailsLoader} from "@/features/groups/pages/Details"
import {loader as groupsListLoader} from "@/features/groups/pages/List"
import {loader as rolesDetailsLoader} from "@/features/roles/pages/Details"
import {loader as rolesListLoader} from "@/features/roles/pages/List"
import {loader as tagsDetailsLoader} from "@/features/tags/pages/Details"
import {loader as tagsListLoader} from "@/features/tags/pages/List"
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
        path: "/documents/by/category",
        element: <DocumentTypesList />,
        loader: documentsByCategoryListLoader
      },
      {
        path: "/documents/by/category/:id",
        element: <DocumentsByCategoryDetails />,
        loader: documentsByCategoryDetailsLoader
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
        element: <TagsList />,
        loader: tagsListLoader
      },
      {
        path: "/tags/:id",
        element: <TagDetails />,
        loader: tagsDetailsLoader
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
        path: "/categories/",
        element: <DocumentTypesList />,
        loader: documentTypesListLoader
      },
      {
        path: "/categories/:id",
        element: <DocumentTypeDetails />,
        loader: documentTypeDetailsLoader
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
        path: "/preferences/me",
        element: <MyPreferences />
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
