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

  //----------------------------------------------
  it("basic tag suggestion 1", () => {
    const input = "tag:"
    const result = getSuggestions(input)

    expect(result).toEqual([
      {
        type: "operator",
        items: ["all:", "any:", "not:"].sort()
      },
      {
        type: "tag",
        filter: "",
        exclude: []
      }
    ])
  })

  //----------------------------------------------
  it("basic tag suggestion 2 - with two parts and no spaces", () => {
    const input = "tag:a"
    const result = getSuggestions(input)

    expect(result).toEqual([
      {
        type: "operator",
        items: ["all:", "any:"].sort()
      },
      {
        type: "tag",
        filter: "a",
        exclude: []
      }
    ])
  })

  //----------------------------------------------
  it("basic tag suggestion 3 - with two parts and spaces", () => {
    const input = "tag: a"
    const result = getSuggestions(input)

    expect(result).toEqual([
      {
        type: "operator",
        items: ["all:", "any:"].sort()
      },
      {
        type: "tag",
        filter: "a",
        exclude: []
      }
    ])
  })
  //----------------------------------------------
  it("basic tag suggestion 4 - with three parts and no spaces", () => {
    const input = "tag:any:inv"
    const result = getSuggestions(input)

    expect(result).toEqual([
      {
        type: "tag",
        filter: "inv",
        exclude: []
      }
    ])
  })
})
