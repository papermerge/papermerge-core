import {describe, it, expect} from "vitest"
import {segmentInput} from "@/features/search/microcomp/utils"

describe("segmentInput", () => {
  //----------------------------------------------
  it("basic", () => {
    const input = "some input value"
    const result = segmentInput(input)

    expect(result).toEqual(["some", "input", "value"])
  })
  //----------------------------------------------
  it("basic with spaces", () => {
    const input = "some   input value"
    const result = segmentInput(input)

    expect(result).toEqual(["some", "  ", "input", "value"])
  })
  //----------------------------------------------
  it("basic with many spaces", () => {
    const input = "some   input   value     and spaces"
    const result = segmentInput(input)

    expect(result).toEqual([
      "some",
      "  ", // two spaces
      "input",
      "  ", // two spaces
      "value",
      "    ", // four spaces
      "and",
      "spaces"
    ])
  })
  //----------------------------------------------
  it("should preserve tokens in quotes", () => {
    const input = "some 'input value'"
    const result = segmentInput(input)

    expect(result).toEqual(["some", "'input value'"])
  })
  //----------------------------------------------
  it("should preserve all spaces in in quotes", () => {
    const input = "some 'input   value'"
    const result = segmentInput(input)

    expect(result).toEqual(["some", "'input   value'"])
  })
})
