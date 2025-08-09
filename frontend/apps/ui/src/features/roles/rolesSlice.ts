import {AppStartListening} from "@/app/listenerMiddleware"
import {RootState} from "@/app/types"
import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import type {Paginated, PaginationType, Role, ServerErrorType} from "@/types"
import {notifications} from "@mantine/notifications"
import {createSelector, createSlice, PayloadAction} from "@reduxjs/toolkit"
import {t} from "i18next"
import {apiSliceWithRoles} from "./apiSlice"

export type RoleSlice = {
  selectedIds: Array<string>
  pagination: PaginationType | null
  lastPageSize: number
}

export const initialState: RoleSlice = {
  selectedIds: [],
  pagination: null,
  lastPageSize: PAGINATION_DEFAULT_ITEMS_PER_PAGES
}

const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    selectionAdd: (state, action: PayloadAction<string>) => {
      state.selectedIds.push(action.payload)
    },
    selectionAddMany: (state, action: PayloadAction<Array<string>>) => {
      state.selectedIds = action.payload
    },
    selectionRemove: (state, action: PayloadAction<string>) => {
      const newSelectedIds = state.selectedIds.filter(i => i != action.payload)
      state.selectedIds = newSelectedIds
    },
    clearSelection: state => {
      state.selectedIds = []
    },
    lastPageSizeUpdate: (state, action: PayloadAction<number>) => {
      state.lastPageSize = action.payload
    }
  },
  extraReducers(builder) {
    builder.addMatcher(
      apiSliceWithRoles.endpoints.getPaginatedRoles.matchFulfilled,
      (state, action) => {
        const payload: Paginated<Role> = action.payload
        state.pagination = {
          pageNumber: payload.page_number,
          pageSize: payload.page_size,
          numPages: payload.num_pages
        }
        state.lastPageSize = payload.page_size
      }
    )
  }
})

export const {
  selectionAdd,
  selectionAddMany,
  selectionRemove,
  clearSelection,
  lastPageSizeUpdate
} = rolesSlice.actions
export default rolesSlice.reducer

export const selectRolesResult = apiSliceWithRoles.endpoints.getRoles.select()
export const selectItemIds = (_: RootState, itemIds: string[]) => itemIds
export const selectItemId = (_: RootState, itemId: string) => itemId

export const selectRolesById = createSelector(
  [selectRolesResult, selectItemIds],
  (rolesData, roleIds) => {
    return rolesData.data?.filter(g => roleIds.includes(g.id))
  }
)

export const selectRoleById = createSelector(
  [selectRolesResult, selectItemId],
  (rolesData, roleId) => {
    return rolesData.data?.find(g => roleId == g.id)
  }
)

export const selectSelectedIds = (state: RootState) => state.roles.selectedIds

export const selectPagination = (state: RootState): PaginationType | null => {
  return state.roles.pagination
}

export const selectLastPageSize = (state: RootState): number => {
  return state.roles.lastPageSize
}

export const roleCRUDListeners = (startAppListening: AppStartListening) => {
  //create positive
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.addNewRole.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.role.created.success")
      })
    }
  })

  // Update positive
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.editRole.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.role.updated.success")
      })
    }
  })
  // Update negative
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.editRole.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: t("notifications.common.error"),
        message: error.data.detail
      })
    }
  })
  // Delete positive
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.deleteRole.matchFulfilled,
    effect: async () => {
      notifications.show({
        withBorder: true,
        message: t("notifications.role.deleted.success")
      })
    }
  })
  // Delete negative
  startAppListening({
    matcher: apiSliceWithRoles.endpoints.deleteRole.matchRejected,
    effect: async action => {
      const error = action.payload as ServerErrorType
      notifications.show({
        autoClose: false,
        withBorder: true,
        color: "red",
        title: t("notifications.common.error"),
        message: error.data.detail
      })
    }
  })
}
