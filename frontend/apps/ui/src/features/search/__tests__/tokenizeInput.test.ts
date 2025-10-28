import {describe, it, expect} from "vitest"
import {tokenizeInput} from "../tokenParser"

describe("tokenizeInput", () => {
  it("should work", () => {
    const input = "some input value"
    const result = tokenizeInput(input)

    expect(result).toEqual(["some", "input", "value"])
  })

  it("should preserve tokens in quotes", () => {
    const input = "some 'input value'"
    const result = tokenizeInput(input)

    expect(result).toEqual(["some", "'input value'"])
  })

  it("with custom field value", () => {
    const input = "some cf:'total amount': < 100"
    const result = tokenizeInput(input)

    expect(result).toEqual(["some", "cf:'total amount':", "<", "100"])
  })
})
