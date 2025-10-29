import {describe, it, expect} from "vitest"
import {parseCompleteToken} from "@/features/search/microcomp/scanner"
import {
  TAG_IMPLICIT_OPERATOR,
  TAG_OP_NOT
} from "@/features/search/microcomp/const"

describe("parseCompleteToken", () => {
  //----------------------------------------------
  it("basic token", () => {
    const input = "tag:invoice"
    const result = parseCompleteToken(input)

    expect(result.token).toEqual({
      type: "tag",
      values: ["invoice"],
      operator: TAG_IMPLICIT_OPERATOR,
      raw: "tag:invoice"
    })
  })

  //----------------------------------------------
  it("token with explicit operation and one value", () => {
    const input = "tag:not:invoice"
    const result = parseCompleteToken(input)

    expect(result.token).toEqual({
      type: "tag",
      values: ["invoice"],
      operator: TAG_OP_NOT,
      raw: "tag:not:invoice"
    })
  })

  //----------------------------------------------
  it("token with explicit operation and multiple values", () => {
    const input = "tag:any:deleted,archived"
    const result = parseCompleteToken(input)

    expect(result.token).toEqual({
      type: "tag",
      values: ["deleted", "archived"],
      operator: "any",
      raw: "tag:any:deleted,archived"
    })
  })

  //----------------------------------------------
  it("incomplete tag token", () => {
    const input = "tag:"
    const result = parseCompleteToken(input)

    expect(result.token).toEqual(undefined)
    expect(result.error).toEqual({
      message: "Incomplete token",
      token: "tag:"
    })
  })
})
