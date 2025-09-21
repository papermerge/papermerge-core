import type {TFunction} from "i18next"

export function getErrorMessage(t: TFunction, error: any) {
  if (!error) return null

  // Handle RTK Query error format
  if (error.status === "FETCH_ERROR") {
    // Network/connection error
    return t("errors.network_error", {
      defaultValue: "Network error. Please check your connection."
    })
  }

  if (error.status === "PARSING_ERROR") {
    // Response parsing error
    return t("errors.parsing_error", {defaultValue: "Server response error."})
  }

  if (error.status === "TIMEOUT_ERROR") {
    // Request timeout
    return t("errors.timeout_error", {
      defaultValue: "Request timed out. Please try again."
    })
  }

  // Handle HTTP status codes (when error.status is a number)
  if (typeof error.status === "number") {
    if (error.status === 400)
      return t("changePasswordModal.errors.invalid_password", {
        defaultValue: "Invalid password format."
      })
    if (error.status === 401)
      return t("changePasswordModal.errors.unauthorized", {
        defaultValue: "You are not authorized to perform this action."
      })
    if (error.status === 403)
      return t("changePasswordModal.errors.forbidden", {
        defaultValue: "Access denied."
      })
    if (error.status === 404)
      return t("changePasswordModal.errors.user_not_found", {
        defaultValue: "User not found."
      })
    if (error.status >= 500)
      return t("changePasswordModal.errors.server_error", {
        defaultValue: "Server error. Please try again later."
      })
  }

  // Fallback: try to extract message from error object
  if (error.data?.message) return error.data.message
  if (error.error) return error.error

  return t("changePasswordModal.errors.password_change_failed", {
    defaultValue: "Failed to change password. Please try again."
  })
}
