import {autocompleteText} from "@/features/search/microcomp/utils"
import {describe, expect, it} from "vitest"

describe("autoCompleteText", () => {
  //----------------------------------------------
  it("basic 1", () => {
    const result = autocompleteText("some t", "text")
    expect(result).toEqual("some text")
  })

  //----------------------------------------------
  it("basic 2", () => {
    const result = autocompleteText("input value with ta", "tags")
    expect(result).toEqual("input value with tags")
  })

  //----------------------------------------------
  it("basic 3", () => {
    const result = autocompleteText("some tag:", "invoice")
    expect(result).toEqual("some tag:invoice")
  })

  //----------------------------------------------
  it("surround with double quotes autocompeleted text which contains spaces", () => {
    const result = autocompleteText("with tag:", "blue sky")
    expect(result).toEqual("with tag:blue sky")
  })
})
