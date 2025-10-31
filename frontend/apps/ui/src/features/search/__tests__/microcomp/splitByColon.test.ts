import {describe, it, expect} from "vitest"
import {splitByColon} from "@/features/search/microcomp/utils"

describe("splitByColon", () => {
  //----------------------------------------------
  it("basic with one colon", () => {
    const input = "tag:invoice"
    const result = splitByColon(input)

    expect(result).toEqual(["tag", "invoice"])
  })

  //----------------------------------------------
  it("basic with two colons", () => {
    const input = "tag:not:invoice"
    const result = splitByColon(input)

    expect(result).toEqual(["tag", "not", "invoice"])
  })

  //----------------------------------------------
  it("basic with two colons and quotes", () => {
    const input = "tag:not:'blue invoice','white invoice'"
    const result = splitByColon(input)

    expect(result).toEqual(["tag", "not", "'blue invoice','white invoice'"])
  })
})
