import {
  getTokenValueItemsFilter,
  getTokenValueItemsToExclude
} from "@/features/search/microcomp/utils"
import {describe, expect, it} from "vitest"

describe("getTagValueItemsFilter", () => {
  it("basic 1", () => {
    const result = getTokenValueItemsFilter("invoice, 'blue sky', deleted")

    expect(result).toEqual("deleted")
  })

  it("basic 2", () => {
    const result = getTokenValueItemsFilter("invoice,")

    expect(result).toEqual("")
  })

  it("basic 3", () => {
    const result = getTokenValueItemsFilter("invoi")

    expect(result).toEqual("invoi")
  })

  it("basic 4", () => {
    const result = getTokenValueItemsFilter("forget,me,not")

    expect(result).toEqual("not")
  })

  it("basic 5", () => {
    const result = getTokenValueItemsFilter("forget,me,not,")

    expect(result).toEqual("")
  })
})

describe("getTagValueItemsToExclude", () => {
  it("basic 1", () => {
    const result = getTokenValueItemsToExclude("forget,me,not")

    expect(result).toEqual(["forget", "me"])
  })

  it("basic 2", () => {
    const result = getTokenValueItemsToExclude("forget,me,not,")

    expect(result).toEqual(["forget", "me", "not"])
  })
})
