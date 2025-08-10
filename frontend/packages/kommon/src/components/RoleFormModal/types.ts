import type {
  I18NCheckButton,
  I18NCollapseButton,
  I18NPermissionTree
} from "../RoleForm/types"

export interface I18NRoleFormModal {
  roleForm: {
    name: string
    permissionTree: I18NPermissionTree
    collapseButton: I18NCollapseButton
    checkButton: I18NCheckButton
  }
  submit: string
  cancel: string
}
