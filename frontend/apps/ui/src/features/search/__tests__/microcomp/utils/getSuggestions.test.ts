import {getSuggestions} from "@/features/search/microcomp/scanner"
import {describe, expect, it} from "vitest"

describe("getSuggestions", () => {
  //----------------------------------------------
  it("basic 1", () => {
    const input = "this is free text"
    const result = getSuggestions(input)

    expect(result).toEqual([])
  })
  //----------------------------------------------
  it("basic 2 - tag prefix", () => {
    const input = "ta"
    const result = getSuggestions(input)

    expect(result).toEqual([
      {
        type: "filter",
        items: ["tag:"]
      }
    ])
  })
  //----------------------------------------------
  it("basic 3 - looks like tag prefix, but it not", () => {
    const input = "bogota"
    const result = getSuggestions(input)

    expect(result).toEqual([])
  })
})
