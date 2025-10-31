import {describe, it, expect} from "vitest"
import {findLongestMatchingIndex} from "@/features/search/microcomp/utils"

describe("findLongestMatchingIndex", () => {
  it("basic 1", () => {
    const result = findLongestMatchingIndex("this ta", "ta")
    //                                       012345
    expect(result).toBe(5)
  })

  it("basic 2", () => {
    const result = findLongestMatchingIndex("tag:aw", "awo")
    //                                       01234
    expect(result).toBe(4)
  })

  it("basic 3", () => {
    const result = findLongestMatchingIndex("this is at", "tag")
    //                                       0123456789
    expect(result).toBe(9)
  })

  it("basic 4", () => {
    const result = findLongestMatchingIndex("hello", "world")
    expect(result).toBe(-1)
  })

  it("basic 5", () => {
    const result = findLongestMatchingIndex("abcabc", "abc")
    //                                       0123
    expect(result).toBe(3)
  })

  it("basic 6", () => {
    const result = findLongestMatchingIndex("aaaa", "aa")
    //                                       012
    expect(result).toBe(2)
  })
})
