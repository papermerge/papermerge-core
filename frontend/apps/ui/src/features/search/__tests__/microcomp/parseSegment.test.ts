import {describe, it, expect} from "vitest"
import {parseSegment} from "@/features/search/microcomp/scanner"
import {FILTERS} from "@/features/search/microcomp/const"

describe("parseSegment", () => {
  //----------------------------------------------------------------
  it("basic 1", () => {
    const result = parseSegment("", false)

    expect(result).toEqual({
      token: {
        type: "space",
        count: 0,
        raw: ""
      },
      tokenIsComplete: true,
      hasSuggestions: true,
      suggestions: [
        {
          items: FILTERS.sort(),
          type: "filter"
        }
      ]
    })
  })
  //----------------------------------------------------------------
  it("basic 2", () => {
    const result = parseSegment("  ", false)

    expect(result).toEqual({
      token: {
        type: "space",
        count: 2,
        raw: "  "
      },
      tokenIsComplete: true,
      hasSuggestions: true,
      suggestions: [
        {
          items: FILTERS.sort(),
          type: "filter"
        }
      ]
    })
  })
  //----------------------------------------------------------------
  it("basic 3", () => {
    const result = parseSegment("t", false)

    expect(result).toEqual({
      tokenIsComplete: false,
      hasSuggestions: true,
      suggestions: [
        {
          items: ["tag:", "title:"].sort(),
          type: "filter"
        }
      ]
    })
  })
  //----------------------------------------------------------------
  it("basic 4", () => {
    const result = parseSegment("ta", false)

    expect(result).toEqual({
      tokenIsComplete: false,
      hasSuggestions: true,
      suggestions: [
        {
          items: ["tag:"],
          type: "filter"
        }
      ]
    })
  })
  //----------------------------------------------------------------
  it("basic 5", () => {
    const result = parseSegment("tag:", false)

    expect(result).toEqual({
      token: {
        type: "tag"
      },
      tokenIsComplete: false,
      hasSuggestions: true,
      suggestions: [
        {
          items: ["all:", "any:", "not:"].sort(),
          type: "operator"
        },
        {
          exclude: [],
          filter: "",
          type: "tag"
        }
      ]
    })
  })
  //----------------------------------------------------------------
  it("basic 6", () => {
    const result = parseSegment("tag:inv", false)

    expect(result.token).toEqual({
      type: "tag"
    })

    expect(result.suggestions).toEqual([
      {
        type: "operator",
        items: []
      },
      {
        exclude: [],
        filter: "inv",
        type: "tag"
      }
    ])
  })

  //----------------------------------------------------------------
  it("basic 7 - user types space after one value tag", () => {
    const result = parseSegment("tag:inv ", true)

    expect(result.token).toEqual({
      type: "tag",
      operator: "all",
      values: ["inv"]
    })

    expect(result.suggestions).toEqual([
      {
        items: FILTERS.sort(),
        type: "filter"
      }
    ])
  })

  //----------------------------------------------------------------
  it("basic 8 - user types space after multiple values tag", () => {
    const result = parseSegment("tag:invoice,archived ", true)

    expect(result.token).toEqual({
      type: "tag",
      operator: "all",
      values: ["invoice", "archived"]
    })

    expect(result.suggestions).toEqual([
      {
        items: FILTERS.sort(),
        type: "filter"
      }
    ])
  })

  //----------------------------------------------------------------
  it("test 9 - user types space after single valued tag which contain space", () => {
    const result = parseSegment('tag:"blue sky"', true)

    expect(result.token).toEqual({
      type: "tag",
      operator: "all",
      values: ["blue sky"]
    })

    expect(result.suggestions).toEqual([
      {
        items: FILTERS.sort(),
        type: "filter"
      }
    ])
  })
  //----------------------------------------------------------------
  it("test 10 - user does not type space after single valued tag which contain space", () => {
    const result = parseSegment('tag:"blue sky"', false)

    expect(result.token).toEqual({
      type: "tag"
    })

    expect(result.suggestions).toEqual([
      {
        items: [],
        type: "operator"
      },
      {
        exclude: [],
        filter: '"blue sky"',
        type: "tag"
      }
    ])
  })
})
