type UUID = string

type FileItem = {
  nodeID?: UUID
  buffer: ArrayBuffer
  docVerID?: UUID
}

class FileManager {
  private files: FileItem[] = []

  store(item: FileItem): void {
    // Remove existing item with same nodeID to avoid duplicates
    this.files = this.files.filter(file => file.nodeID !== item.nodeID)
    this.files.push(item)
  }

  get(nodeID: UUID): FileItem | undefined {
    return this.files.find(file => file.nodeID === nodeID)
  }

  getBuffer(nodeID: UUID): ArrayBuffer | undefined {
    const item = this.get(nodeID)
    return item?.buffer
  }

  getAll(): FileItem[] {
    return [...this.files] // Return a copy to prevent external mutations
  }

  getByDocVerID(docVerID: UUID): FileItem[] {
    return this.files.filter(file => file.docVerID === docVerID)
  }

  update(nodeID: UUID, updates: Partial<Omit<FileItem, 'nodeID'>>): boolean {
    const index = this.files.findIndex(file => file.nodeID === nodeID)
    if (index === -1) return false

    this.files[index] = {
      ...this.files[index],
      ...updates
    }
    return true
  }

  delete(nodeID: UUID): boolean {
    const initialLength = this.files.length
    this.files = this.files.filter(file => file.nodeID !== nodeID)
    return this.files.length < initialLength
  }

  deleteByDocVerID(docVerID: UUID): number {
    const initialLength = this.files.length
    this.files = this.files.filter(file => file.docVerID !== docVerID)
    return initialLength - this.files.length // Return count of deleted items
  }

  has(nodeID: UUID): boolean {
    return this.files.some(file => file.nodeID === nodeID)
  }

  count(): number {
    return this.files.length
  }

  clear(): void {
    this.files = []
  }

  filter(predicate: (item: FileItem) => boolean): FileItem[] {
    return this.files.filter(predicate)
  }

  getTotalSize(): number {
    return this.files.reduce((total, file) => total + file.buffer.byteLength, 0)
  }

}

export const fileManager = new FileManager()

// Usage examples:
/*
// Store a file
fileManager.store({
  nodeID: 'node-123',
  buffer: arrayBuffer,
  docVerID: 'doc-456'
})

// Get a file
const fileItem = fileManager.get('node-123')
const buffer = fileManager.getBuffer('node-123')

// Get all files for a document version
const docFiles = fileManager.getByDocVerID('doc-456')

// Update a file (e.g., add docVerID to existing file)
*/
