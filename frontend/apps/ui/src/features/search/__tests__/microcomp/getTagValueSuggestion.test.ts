import {describe, it, expect} from "vitest"
import {
  getTagValueItemsFilter,
  getTagValueItemsToExclude
} from "@/features/search/microcomp/utils"

describe("getTagValueItemsFilter", () => {
  it("basic 1", () => {
    const result = getTagValueItemsFilter("invoice, 'blue sky', deleted")

    expect(result).toEqual("deleted")
  })

  it("basic 2", () => {
    const result = getTagValueItemsFilter("invoice,")

    expect(result).toEqual("")
  })

  it("basic 3", () => {
    const result = getTagValueItemsFilter("invoi")

    expect(result).toEqual("invoi")
  })

  it("basic 4", () => {
    const result = getTagValueItemsFilter("forget,me,not")

    expect(result).toEqual("not")
  })

  it("basic 5", () => {
    const result = getTagValueItemsFilter("forget,me,not,")

    expect(result).toEqual("")
  })
})

describe("getTagValueItemsToExclude", () => {
  it("basic 1", () => {
    const result = getTagValueItemsToExclude("forget,me,not")

    expect(result).toEqual(["forget", "me"])
  })

  it("basic 2", () => {
    const result = getTagValueItemsToExclude("forget,me,not,")

    expect(result).toEqual(["forget", "me", "not"])
  })
})
