import {scanSearchText} from "@/features/search/microcomp/scanner"
import {describe, expect, it} from "vitest"
import {FILTERS} from "../../microcomp/const"

describe("scanSearchText", () => {
  //----------------------------------------------
  it("basic 1", () => {
    const input = "some text t"
    const result = scanSearchText(input)

    expect(result.hasSuggestions).toBe(true)
    expect(result.suggestions).toEqual([
      {
        type: "filter",
        items: ["tag:", "title:"].sort()
      }
    ])
  })

  //----------------------------------------------
  it("basic 2", () => {
    const input = "some text c"
    const result = scanSearchText(input)

    expect(result.hasSuggestions).toBe(true)
    expect(result.suggestions).toEqual([
      {
        type: "filter",
        items: ["cat:", "cf:", "created_by:", "created_at:"].sort()
      }
    ])
  })

  //----------------------------------------------
  it("suggestion operations", () => {
    const input = "some text tag:"
    const result = scanSearchText(input)

    expect(result.hasSuggestions).toBe(true)
    expect(result.suggestions).toEqual([
      {
        type: "operator",
        items: ["any:", "not:", "all:"].sort()
      },
      {
        type: "tag",
        exclude: [],
        filter: ""
      }
    ])
  })

  //----------------------------------------------
  it("should not suggest tag completion if there is no comma at the end of tag list", () => {
    const input = "some text tag:invoice"
    const result = scanSearchText(input)

    expect(result.hasSuggestions).toBe(true)
    expect(result.suggestions).toEqual([
      {type: "operator", items: []},
      {
        type: "tag",
        exclude: [],
        filter: "invoice"
      }
    ])
  })

  //----------------------------------------------
  it("should return complete token if there one space at the end", () => {
    const input = "some text tag:invoice " // one space at the end
    const result = scanSearchText(input)

    expect(result.hasSuggestions).toBe(true)
    expect(result.tokenIsComplete).toBe(true)
    expect(result.token).toEqual({
      type: "tag",
      operator: "all",
      values: ["invoice"]
    })

    expect(result.suggestions).toEqual([
      {
        type: "filter",
        items: FILTERS.sort()
      }
    ])
  })

  //----------------------------------------------
  it("suggestion tag completion if user added a comma", () => {
    const input = "some text tag:invoice," // notice comma at the end of tag list
    const result = scanSearchText(input)

    expect(result.hasSuggestions).toBe(true)
    expect(result.suggestions).toEqual([
      {
        type: "operator",
        items: []
      },
      {
        type: "tag",
        exclude: ["invoice"],
        filter: ""
      }
    ])
  })
})
