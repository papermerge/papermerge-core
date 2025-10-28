import {describe, it, expect} from "vitest"
import {segmentInput} from "@/features/search/microcomp/utils"

describe("tokenizeInput", () => {
  it("basic", () => {
    const input = "some input value"
    const result = segmentInput(input)

    expect(result).toEqual(["some", "input", "value"])
  })

  it("basic with spaces", () => {
    const input = "some   input value"
    const result = segmentInput(input)

    expect(result).toEqual(["some", "  ", "input", "value"])
  })
})
