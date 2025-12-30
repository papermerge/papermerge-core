/**
 * Types for API Tokens (Personal Access Tokens) feature
 */

export interface APIToken {
  id: string
  name: string
  token_prefix: string
  scopes: string[] | null
  created_at: string
  expires_at: string | null
  last_used_at: string | null
}

export interface APITokenCreated extends APIToken {
  /** The actual token value - only returned once at creation! */
  token: string
}

export interface CreateAPITokenRequest {
  name: string
  scopes?: string[]
  expires_in_days?: number
}

export interface DeleteAPITokenResponse {
  id: string
  name: string
  message: string
}
