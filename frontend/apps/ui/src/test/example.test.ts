import {describe, it, expect} from "vitest"

describe("Testing Infrastructure", () => {
  it("should run basic tests", () => {
    expect(1 + 1).toBe(2)
  })

  it("should handle string operations", () => {
    expect("hello").toMatch(/hello/)
    expect("world").toHaveLength(5)
  })

  it("should work with arrays", () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  it("should work with objects", () => {
    const obj = {name: "test", value: 123}
    expect(obj).toHaveProperty("name")
    expect(obj.name).toBe("test")
  })

  it("should handle async operations", async () => {
    const promise = Promise.resolve("success")
    await expect(promise).resolves.toBe("success")
  })
})
