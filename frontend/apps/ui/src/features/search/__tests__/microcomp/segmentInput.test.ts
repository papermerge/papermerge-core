import {describe, it, expect} from "vitest"
import {segmentInput} from "@/features/search/microcomp/utils"

describe("segmentInput", () => {
  //----------------------------------------------
  it("basic", () => {
    const input = "some input value"
    const result = segmentInput(input)

    expect(result.segments).toEqual(["some", "input", "value"])
    expect(result.nonEmptyInputCompletedWithSpace).toBe(false)
  })
  //----------------------------------------------
  it("basic with spaces", () => {
    const input = "some   input value"
    const result = segmentInput(input)

    expect(result.segments).toEqual(["some", "  ", "input", "value"])
    expect(result.nonEmptyInputCompletedWithSpace).toBe(false)
  })
  //----------------------------------------------
  it("basic with many spaces", () => {
    const input = "some   input   value     and spaces"
    const result = segmentInput(input)

    expect(result.segments).toEqual([
      "some",
      "  ", // two spaces
      "input",
      "  ", // two spaces
      "value",
      "    ", // four spaces
      "and",
      "spaces"
    ])
    expect(result.nonEmptyInputCompletedWithSpace).toBe(false)
  })
  //----------------------------------------------
  it("should preserve tokens in quotes", () => {
    const input = "some 'input value'"
    const result = segmentInput(input)

    expect(result.segments).toEqual(["some", "'input value'"])
    expect(result.nonEmptyInputCompletedWithSpace).toBe(false)
  })
  //----------------------------------------------
  it("should preserve all spaces in in quotes", () => {
    const input = "some 'input   value'"
    const result = segmentInput(input)

    expect(result.segments).toEqual(["some", "'input   value'"])
  })
  //------------------------------
  it("should work with tag syntax", () => {
    const input = " free text tag:'Blue Sky'"
    const result = segmentInput(input)

    expect(result.segments).toEqual([" ", "free", "text", "tag:'Blue Sky'"])
    expect(result.nonEmptyInputCompletedWithSpace).toBe(false)
  })

  it("should work with tag syntax with multiple spaces", () => {
    const input = " free text tag:'Blue   Sky','Green   Field'"
    const result = segmentInput(input)

    expect(result.segments).toEqual([
      " ",
      "free",
      "text",
      "tag:'Blue   Sky','Green   Field'"
    ])

    expect(result.nonEmptyInputCompletedWithSpace).toBe(false)
  })

  it("with spaces at the end", () => {
    const result = segmentInput("tag:inv ")
    expect(result.segments).toEqual(["tag:inv"])
    expect(result.nonEmptyInputCompletedWithSpace).toBe(true)
  })
})
