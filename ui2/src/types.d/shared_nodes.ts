export type NewSharedNodes = {
  user_ids: string[]
  role_ids: string[]
  group_ids: string[]
  node_ids: string[]
}

type Role = {
  name: string
  id: string
}

type User = {
  username: string
  roles: Array<Role>
}

type Group = {
  name: string
  roles: Array<Role>
}

export type SharedNodeAccessDetails = {
  id: string // node ID
  users: Array<User>
  groups: Array<Group>
}
