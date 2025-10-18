// frontend/apps/ui/src/hooks/useAuth.ts
import {useMemo} from "react"
import {useSelector} from "react-redux"
import {selectCurrentUser} from "@/slices/currentUser"
import type {User} from "@/types"

/**
 * Centralized Authorization Hook
 *
 * Provides a consistent way to check user permissions across the application.
 *
 * @example
 * ```tsx
 * import { useAuth } from '@/hooks/useAuth'
 * import { USER_CREATE, USER_DELETE } from '@/scopes'
 *
 * function MyComponent() {
 *   const { hasPermission, isSuperuser } = useAuth()
 *
 *   return (
 *     <>
 *       {hasPermission(USER_CREATE) && <CreateButton />}
 *       {hasPermission(USER_DELETE) && <DeleteButton />}
 *       {isSuperuser && <AdminPanel />}
 *     </>
 *   )
 * }
 * ```
 */
export function useAuth() {
  const user = useSelector(selectCurrentUser) as User | null

  // Memoize the scopes set for O(1) lookup performance
  const userScopes = useMemo(() => {
    if (!user || !user.scopes) {
      return new Set<string>()
    }
    return new Set(user.scopes)
  }, [user])

  /**
   * Check if the current user is a superuser
   */
  const isSuperuser = useMemo(() => {
    return user?.is_superuser ?? false
  }, [user])

  /**
   * Check if user has a specific permission
   * Superusers automatically have all permissions
   *
   * @param permission - The permission scope to check (e.g., 'user.create')
   * @returns true if user has the permission or is superuser
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    if (isSuperuser) return true
    return userScopes.has(permission)
  }

  /**
   * Check if user has ANY of the specified permissions
   * Returns true if user has at least one permission
   *
   * @param permissions - Array of permission scopes
   * @returns true if user has any of the permissions or is superuser
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false
    if (isSuperuser) return true
    return permissions.some(permission => userScopes.has(permission))
  }

  /**
   * Check if user has ALL of the specified permissions
   *
   * @param permissions - Array of permission scopes
   * @returns true if user has all permissions or is superuser
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false
    if (isSuperuser) return true
    return permissions.every(permission => userScopes.has(permission))
  }

  /**
   * Get all user scopes as an array
   */
  const getScopes = (): string[] => {
    return Array.from(userScopes)
  }

  /**
   * Check if user has permissions for a specific category and action
   *
   * @param category - Category prefix (e.g., 'user', 'node', 'document')
   * @param action - Specific action (e.g., 'create', 'view', 'update', 'delete')
   * @returns true if user has the permission
   */
  const hasCategoryPermission = (category: string, action: string): boolean => {
    return hasPermission(`${category}.${action}`)
  }

  return {
    user,
    isSuperuser,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasCategoryPermission,
    getScopes
  }
}
