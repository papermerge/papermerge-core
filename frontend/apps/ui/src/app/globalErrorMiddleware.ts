// ============================================================================
// RTK Query Middleware for Global Error Handling
// ============================================================================

import {notifications} from "@/features/notifications/utils"
import {getErrorMessage, getErrorTitle} from "@/utils/errorHandling"
import {Action, isRejectedWithValue, Middleware} from "@reduxjs/toolkit"
import {t} from "i18next"

interface RTKQueryAction extends Action {
  meta?: {
    arg?: {
      endpointName?: string
      [key: string]: any
    }
    [key: string]: any
  }
}

/**
 * Global error handling middleware for RTK Query
 * Automatically shows notifications for all rejected mutations
 */
export const rtkQueryErrorLogger: Middleware = () => next => action => {
  // Check if this is a rejected action from RTK Query
  if (isRejectedWithValue(action)) {
    // Extract endpoint name and operation type from the action
    const endpointName = (action as RTKQueryAction).meta?.arg?.endpointName
    const operationType = extractOperationType(endpointName)

    // Create context for better error messages
    const context = operationType || "generic"

    const errorMessage = getErrorMessage(action.payload, t, context)
    const errorTitle = getErrorTitle(action.payload, t, context)

    // Show error notification
    notifications.show({
      autoClose: false,
      withBorder: true,
      color: "red",
      title: errorTitle,
      message: errorMessage
    })
  }

  return next(action)
}

/**
 * Extract operation type from endpoint name
 * e.g., "addNewUser" -> "user.create"
 */
function extractOperationType(endpointName?: string): string | undefined {
  if (!endpointName) return undefined

  // Map of common prefixes to operations
  const operationMap: Record<string, string> = {
    addNew: "create",
    add: "create",
    edit: "update",
    update: "update",
    delete: "delete",
    remove: "delete"
  }

  // Extract the operation prefix
  for (const [prefix, operation] of Object.entries(operationMap)) {
    if (endpointName.startsWith(prefix)) {
      // Extract entity name (e.g., "User" from "addNewUser")
      const entityName = endpointName.replace(prefix, "").toLowerCase()
      return `${entityName}.${operation}`
    }
  }

  return undefined
}
