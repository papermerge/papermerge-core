import {describe, it, expect} from "vitest"
import {autocompleteText} from "@/features/search/microcomp/utils"

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
})
