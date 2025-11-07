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
  //----------------------------------------------
  it("Category suggestion 1 - cat: - just filter name", () => {
    const input = "cat:"
    const result = getSuggestions(input)

    expect(result).toEqual([
      {
        type: "operator",
        items: ["any:", "not:"].sort()
      },
      {
        type: "category",
        filter: "",
        exclude: []
      }
    ])
  })

  //----------------------------------------------
  it("Category suggestion 2 - cat:values - no spaces between filter name and values", () => {
    const input = "cat:a"
    const result = getSuggestions(input)

    expect(result).toEqual([
      {
        type: "operator",
        items: ["any:"].sort()
      },
      {
        type: "category",
        filter: "a",
        exclude: []
      }
    ])
  })

  //----------------------------------------------
  it("Category suggestion 3 - cat:  values - with saces between filter name and values", () => {
    const input = "cat: a"
    const result = getSuggestions(input)

    expect(result).toEqual([
      {
        type: "operator",
        items: ["any:"].sort()
      },
      {
        type: "category",
        filter: "a",
        exclude: []
      }
    ])
  })

  //----------------------------------------------
  it("Category suggestion 4 - cat:operator:values", () => {
    const input = "cat:any:letter"
    const result = getSuggestions(input)

    expect(result).toEqual([
      {
        type: "category",
        filter: "letter",
        exclude: []
      }
    ])
  })
})
