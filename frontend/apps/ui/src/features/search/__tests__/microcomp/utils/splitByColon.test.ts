import {splitByColon} from "@/features/search/microcomp/utils"
import {describe, expect, it} from "vitest"

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

  //----------------------------------------------
  it("should work with colon in quotes - example 1", () => {
    const input = 'cf:"Total in Quoter: 2": 100'
    const result = splitByColon(input)

    expect(result).toEqual(["cf", '"Total in Quoter: 2"', " 100"])
  })

  //----------------------------------------------
  it("should work with colon in quotes - example 2", () => {
    const input = 'title:"has this text with : char"'
    const result = splitByColon(input)

    expect(result).toEqual(["title", '"has this text with : char"'])
  })

  //----------------------------------------------
  it("should work with colon in quotes - example 3", () => {
    const input = 'tag:"namespace:myvalue sp"'
    const result = splitByColon(input)

    expect(result).toEqual(["tag", '"namespace:myvalue sp"'])
  })

  //----------------------------------------------
  it("Edge case 1 - opened quote", () => {
    const input = '"tag:'
    const result = splitByColon(input)

    expect(result).toEqual(['"tag:'])
  })

  //----------------------------------------------
  it("Edge case 2 - one closed pair of quotes and one opened quote", () => {
    const input = '"tag:" "tag:'
    const result = splitByColon(input)

    expect(result).toEqual(['"tag:" "tag:'])
  })

  //----------------------------------------------
  it("Edge case 3 - no value after colon", () => {
    const input = "tag:"
    const result = splitByColon(input)

    expect(result).toEqual(["tag", ""])
  })
})
