export type NewSharedNodes = {
  user_ids: string[]
  role_ids: string[]
  group_ids: string[]
  node_ids: string[]
}

export type Role = {
  name: string
  id: string
}

export type User = {
  id: string
  username: string
  roles: Array<Role>
}

export type Group = {
  name: string
  id: string
  roles: Array<Role>
}

export type SharedNodeAccessDetails = {
  id: string // node ID
  users: Array<User>
  groups: Array<Group>
}
