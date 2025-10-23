const SCOPE_TO_SKIP = [
  "folder",
  "document",
  "tag",
  "custom_field",
  "document_type",
  "shared_node",
  "user",
  "role",
  "group",
  "document.page",
  "system_preference",
  "audit_log"
]

const FOLDER_DOCUMENT_NODE_MAP: Record<string, string> = {
  "folder.view": "node.view",
  "folder.create": "node.create",
  "folder.update": "node.update",
  "folder.move": "node.move",
  "folder.delete": "node.delete",
  "document.view": "node.view",
  "document.update": "node.update",
  "document.move": "node.move",
  "document.delete": "node.delete"
}

const PAGE_MANAGEMENT_MAP_C2S: Record<string, string> = {
  "document.page.extract": "page.extract",
  "document.page.move": "page.move",
  "document.page.rotate": "page.rotate",
  "document.page.reorder": "page.reorder",
  "document.page.delete": "page.delete"
}

function client2serverPerms(scopes: string[]): string[] {
  let result: string[] = []

  scopes.forEach(scope => {
    if (SCOPE_TO_SKIP.includes(scope)) {
      //
    } else {
      if (Object.keys(FOLDER_DOCUMENT_NODE_MAP).includes(scope)) {
        result.push(FOLDER_DOCUMENT_NODE_MAP[scope])
      } else if (Object.keys(PAGE_MANAGEMENT_MAP_C2S).includes(scope)) {
        result.push(PAGE_MANAGEMENT_MAP_C2S[scope])
      } else {
        result.push(scope)
      }
    }
  })

  result.push("user.me")

  return result
}

const NODE_FOLDER_DOCUMENT_MAP: Record<string, string[]> = {
  "node.view": ["folder.view", "document.view"],
  "node.create": ["folder.create"],
  "node.update": ["folder.update", "document.update.title"],
  "node.delete": ["folder.delete", "document.delete"],
  "node.move": ["folder.move", "document.move"]
}

const PAGE_MANAGEMENT_MAP_S2C: Record<string, string> = {
  "page.extract": "document.page.extract",
  "page.move": "document.page.move",
  "page.rotate": "document.page.rotate",
  "page.reorder": "document.page.reorder",
  "page.delete": "document.page.delete"
}

function server2clientPerms(scopes: string[]): string[] {
  let result: string[] = []

  scopes.forEach(scope => {
    if (Object.keys(NODE_FOLDER_DOCUMENT_MAP).includes(scope)) {
      result.push(...NODE_FOLDER_DOCUMENT_MAP[scope])
    } else if (Object.keys(PAGE_MANAGEMENT_MAP_S2C).includes(scope)) {
      result.push(PAGE_MANAGEMENT_MAP_S2C[scope])
    } else {
      result.push(scope)
    }
  })

  return result
}

export {client2serverPerms, server2clientPerms}
