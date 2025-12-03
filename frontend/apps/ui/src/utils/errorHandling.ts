// ============================================================================
// Global Error Handling Utilities
// ============================================================================

import {SerializedError} from "@reduxjs/toolkit"
import {FetchBaseQueryError} from "@reduxjs/toolkit/query"
import {TFunction} from "i18next"

/**
 * Standard error structure from the backend
 */

export interface AttrError {
  name: string
  message: string
}

export interface StructuredError {
  attrs?: AttrError[] | null
  messages?: string[] | null
}

export interface ServerErrorType {
  data: {
    detail: string | StructuredError
    [key: string]: any
  }
  status: number
}

/**
 * Type guard to check if error is FetchBaseQueryError
 */
export function isFetchBaseQueryError(
  error: unknown
): error is FetchBaseQueryError {
  return typeof error === "object" && error != null && "status" in error
}

/**
 * Type guard to check if error is SerializedError
 */
export function isSerializedError(error: unknown): error is SerializedError {
  return (
    typeof error === "object" &&
    error != null &&
    ("message" in error || "code" in error)
  )
}

/**
 * Extract user-friendly error message from various error types
 */
export function getErrorMessage(
  error: unknown,
  t: TFunction,
  context?: string
): string {
  // Handle RTK Query FetchBaseQueryError
  if (isFetchBaseQueryError(error)) {
    // Network errors
    if (error.status === "FETCH_ERROR") {
      return t("errors.network_error", {
        defaultValue: "Network error. Please check your connection."
      })
    }

    // Parsing errors
    if (error.status === "PARSING_ERROR") {
      return t("errors.parsing_error", {
        defaultValue: "Server response error."
      })
    }

    // Timeout errors
    if (error.status === "TIMEOUT_ERROR") {
      return t("errors.timeout_error", {
        defaultValue: "Request timed out. Please try again."
      })
    }

    // Handle HTTP status codes
    if (typeof error.status === "number") {
      const serverError = error as ServerErrorType

      const errorMessage = extractDetailMessage(serverError.data?.detail)

      // If backend provides specific error detail, use it
      if (errorMessage) {
        return errorMessage
      }

      // Generic status code messages with context
      const statusMessages: Record<number, string> = {
        400: t(`errors.${context}.bad_request`, {
          defaultValue: t("errors.bad_request", {
            defaultValue: "Invalid request. Please check your input."
          })
        }),
        401: t(`errors.${context}.unauthorized`, {
          defaultValue: t("errors.unauthorized", {
            defaultValue: "You are not authorized to perform this action."
          })
        }),
        403: t(`errors.${context}.forbidden`, {
          defaultValue: t("errors.forbidden", {
            defaultValue: "Access denied."
          })
        }),
        404: t(`errors.${context}.not_found`, {
          defaultValue: t("errors.not_found", {
            defaultValue: "Resource not found."
          })
        }),
        409: t(`errors.${context}.conflict`, {
          defaultValue: t("errors.conflict", {
            defaultValue: "Conflict: Resource already exists or is in use."
          })
        }),
        422: t(`errors.${context}.validation_error`, {
          defaultValue: t("errors.validation_error", {
            defaultValue: "Validation error. Please check your input."
          })
        }),
        500: t(`errors.${context}.server_error`, {
          defaultValue: t("errors.server_error", {
            defaultValue: "Server error. Please try again later."
          })
        })
      }

      if (error.status in statusMessages) {
        return statusMessages[error.status]
      }

      // Generic 5xx error
      if (error.status >= 500) {
        return t("errors.server_error", {
          defaultValue: "Server error. Please try again later."
        })
      }
    }
  }

  // Handle SerializedError from RTK
  if (isSerializedError(error)) {
    if (error.message) {
      return error.message
    }
  }

  // Fallback error message with context
  if (context) {
    return t(`errors.${context}.generic`, {
      defaultValue: t("errors.generic", {
        defaultValue: "An unexpected error occurred. Please try again."
      })
    })
  }

  return t("errors.generic", {
    defaultValue: "An unexpected error occurred. Please try again."
  })
}

/**
 * Get error title for notifications
 */
export function getErrorTitle(
  error: unknown,
  t: TFunction,
  context?: string
): string {
  if (isFetchBaseQueryError(error) && typeof error.status === "number") {
    if (error.status >= 500) {
      return t("errors.title.server_error", {
        defaultValue: "Server Error"
      })
    }
    if (error.status === 401 || error.status === 403) {
      return t("errors.title.access_denied", {
        defaultValue: "Access Denied"
      })
    }
    if (error.status === 404) {
      return t("errors.title.not_found", {
        defaultValue: "Not Found"
      })
    }
    if (error.status === 409) {
      return t("errors.title.conflict", {
        defaultValue: "Conflict"
      })
    }
    if (error.status === 422 || error.status === 400) {
      return t("errors.title.validation_error", {
        defaultValue: "Validation Error"
      })
    }
  }

  if (context) {
    return t(`errors.${context}.title`, {
      defaultValue: t("errors.title.error", {defaultValue: "Error"})
    })
  }

  return t("errors.title.error", {defaultValue: "Error"})
}

/**
 * Extract message from backend's detail field
 * Handles both string and structured error formats:

    ✅ {"detail": "Simple string"} → Shows the string
    ✅ {"detail": {"messages": [...], "attrs": [...]}} → Shows combined messages
    ✅ {"detail": {"attrs": null, "messages": null}} → Shows generic "Invalid request" message
 */
function extractDetailMessage(
  detail: string | StructuredError | undefined
): string | null {
  if (!detail) return null

  // If detail is a simple string, return it
  if (typeof detail === "string") {
    return detail
  }

  // Handle structured error format: { attrs: [...], messages: [...] }
  if (typeof detail === "object") {
    const messages: string[] = []

    // Extract messages from the messages array
    if (
      detail.messages &&
      Array.isArray(detail.messages) &&
      detail.messages.length > 0
    ) {
      messages.push(...detail.messages.filter(msg => msg)) // Filter out empty strings
    }

    // Extract messages from attrs array
    if (
      detail.attrs &&
      Array.isArray(detail.attrs) &&
      detail.attrs.length > 0
    ) {
      for (const attr of detail.attrs) {
        if (attr.message) {
          // Format: "Field name: error message"
          messages.push(`${attr.name}: ${attr.message}`)
        }
      }
    }

    // Join all messages with line breaks
    if (messages.length > 0) {
      return messages.join("\n")
    }

    // If we got a structured error object but no actual messages,
    // return null so we fall back to generic messages
  }

  return null
}

/**
 * Extract error message from a Form.
 * Used in:
 *  - new custom field modal
 *  - new document type modal
 */
export function extractApiError(err: unknown, fallback: string): string {
  const error = err as {data?: {detail?: unknown}}

  if (Array.isArray(error?.data?.detail)) {
    return error.data.detail.map((e: {msg?: string}) => e.msg).join(", ")
  }

  if (typeof error?.data?.detail === "string") {
    return error.data.detail
  }

  return fallback
}
