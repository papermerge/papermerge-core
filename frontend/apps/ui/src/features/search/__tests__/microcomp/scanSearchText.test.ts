import {describe, it, expect} from "vitest"
import {scanSearchText} from "@/features/search/microcomp/scanner"

describe("scanSearchText", () => {
  //----------------------------------------------
  it("basic 1", () => {
    const input = "some text t"
    const result = scanSearchText(input)

    expect(result.hasSuggestions).toBe(true)
    expect(result.suggestions).toEqual({
      type: "keyword",
      items: ["tag", "title"].sort()
    })
  })

  //----------------------------------------------
  it("basic 2", () => {
    const input = "some text c"
    const result = scanSearchText(input)

    expect(result.hasSuggestions).toBe(true)
    expect(result.suggestions).toEqual({
      type: "keyword",
      items: ["cat", "cf", "created_by", "created_at"].sort()
    })
  })

  //----------------------------------------------
  it("suggestion operations", () => {
    const input = "some text tag:"
    const result = scanSearchText(input)

    expect(result.hasSuggestions).toBe(true)
    expect(result.suggestions).toEqual({
      type: "operator",
      items: ["any", "not", "all"].sort()
    })
  })
})
