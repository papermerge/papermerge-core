import {describe, it, expect} from "vitest"
import {scanSearchText} from "@/features/search/microcomp/scanner"

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
  it("should not suggest tag completion if there is no comma at the end  - with spaces", () => {
    const input = "some text tag:invoice   " // no comma, however there are some spaces
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
