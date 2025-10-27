import {describe, it, expect} from "vitest"
import {parseTokens} from "../tokenParser"

/**
 * Token Parser Tests (Updated for new operator syntax)
 *
 * New Syntax:
 * - Custom fields: fieldname:operator value (NO colon after operator)
 * - Examples: total:>100, status:=completed, amount:100
 * - Operator = can be omitted: total:100 means total:=100
 *
 * Token Types:
 * - Plain text → FTS
 * - category:value or "Category Name":value
 * - tag:value or "Tag Name":value
 * - fieldname:operator value or "Field Name":operator value
 *
 * Operators: =, !=, >, >=, <, <=, contains, icontains
 */

describe("tokenParser - Basic Parsing", () => {
  it("should parse plain text as FTS token", () => {
    const input = "invoice documents"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0]).toEqual({
      type: "fts",
      name: "fts",
      value: "invoice documents"
    })
    expect(result.isValid).toBe(true)
  })

  it("should parse empty input", () => {
    const input = ""
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(0)
    expect(result.isValid).toBe(true)
  })

  it("should parse whitespace-only input as empty", () => {
    const input = "   "
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(0)
    expect(result.isValid).toBe(true)
  })
})

describe("tokenParser - Category Tokens", () => {
  it("should parse category token", () => {
    const input = "category:Invoice"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0]).toEqual({
      type: "category",
      name: "category",
      value: "Invoice"
    })
    expect(result.isValid).toBe(true)
  })

  it("should parse category token with cat shorthand", () => {
    const input = "cat:Contract"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0]).toEqual({
      type: "category",
      name: "category",
      value: "Contract"
    })
  })

  it("should parse category with spaces in value (quoted)", () => {
    const input = 'category:"Annual Report"'
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("Annual Report")
  })

  it("should parse multiple categories as array", () => {
    const input = "category:Invoice,Contract"
    const result = parseTokens(input)

    expect(result.tokens[0]).toEqual({
      type: "category",
      name: "category",
      value: ["Invoice", "Contract"]
    })
  })

  it("should parse category with spaces in multiple values", () => {
    const input = 'category:"Sales Invoice","Purchase Order"'
    const result = parseTokens(input)

    expect(result.tokens[0].value).toEqual(["Sales Invoice", "Purchase Order"])
  })
})

describe("tokenParser - Tag Tokens", () => {
  it("should parse tag token (AND logic)", () => {
    const input = "tag:urgent"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0]).toEqual({
      type: "tag",
      name: "tag",
      value: "urgent"
    })
  })

  it("should parse multiple tags as array", () => {
    const input = "tag:urgent,2024"
    const result = parseTokens(input)

    expect(result.tokens[0]).toEqual({
      type: "tag",
      name: "tag",
      value: ["urgent", "2024"]
    })
  })

  it("should parse tag_any token (OR logic)", () => {
    const input = "tag_any:blue,green,red"
    const result = parseTokens(input)

    expect(result.tokens[0]).toEqual({
      type: "tag_any",
      name: "tag_any",
      value: ["blue", "green", "red"]
    })
  })

  it("should parse tag_not token (NOT logic)", () => {
    const input = "tag_not:archived"
    const result = parseTokens(input)

    expect(result.tokens[0]).toEqual({
      type: "tag_not",
      name: "tag_not",
      value: "archived"
    })
  })

  it("should parse multiple tag_not values", () => {
    const input = "tag_not:archived,deleted"
    const result = parseTokens(input)

    expect(result.tokens[0].value).toEqual(["archived", "deleted"])
  })

  it("should parse tags with spaces (quoted)", () => {
    const input = 'tag:"high priority"'
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("high priority")
  })

  it("should parse multiple tags with spaces", () => {
    const input = 'tag:"high priority","Q1 2024"'
    const result = parseTokens(input)

    expect(result.tokens[0].value).toEqual(["high priority", "Q1 2024"])
  })
})

describe("tokenParser - Custom Field Tokens (New Syntax)", () => {
  it("should parse custom field with = operator", () => {
    const input = "status:=completed"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(1)
    expect(result.tokens[0]).toEqual({
      type: "custom_field",
      name: "status",
      operator: "=",
      value: "completed"
    })
  })

  it("should parse custom field with implicit = (no operator)", () => {
    const input = "status:completed"
    const result = parseTokens(input)

    expect(result.tokens[0]).toEqual({
      type: "custom_field",
      name: "status",
      operator: "=",
      value: "completed"
    })
  })

  it("should parse custom field with implicit = for numeric value", () => {
    const input = "total:100"
    const result = parseTokens(input)

    expect(result.tokens[0]).toEqual({
      type: "custom_field",
      name: "total",
      operator: "=",
      value: "100"
    })
  })

  it("should parse custom field with != operator", () => {
    const input = "status:!=pending"
    const result = parseTokens(input)

    expect(result.tokens[0].operator).toBe("!=")
    expect(result.tokens[0].value).toBe("pending")
  })

  it("should parse custom field with > operator", () => {
    const input = "total:>100"
    const result = parseTokens(input)

    expect(result.tokens[0]).toEqual({
      type: "custom_field",
      name: "total",
      operator: ">",
      value: "100"
    })
  })

  it("should parse custom field with >= operator", () => {
    const input = "amount:>=50"
    const result = parseTokens(input)

    expect(result.tokens[0].operator).toBe(">=")
    expect(result.tokens[0].value).toBe("50")
  })

  it("should parse custom field with < operator", () => {
    const input = "price:<1000"
    const result = parseTokens(input)

    expect(result.tokens[0].operator).toBe("<")
    expect(result.tokens[0].value).toBe("1000")
  })

  it("should parse custom field with <= operator", () => {
    const input = "count:<=10"
    const result = parseTokens(input)

    expect(result.tokens[0].operator).toBe("<=")
    expect(result.tokens[0].value).toBe("10")
  })

  it("should parse custom field with contains operator", () => {
    const input = "description:contains meeting"
    const result = parseTokens(input)

    expect(result.tokens[0].operator).toBe("contains")
    expect(result.tokens[0].value).toBe("meeting")
  })

  it("should parse custom field with icontains operator", () => {
    const input = "title:icontains report"
    const result = parseTokens(input)

    expect(result.tokens[0].operator).toBe("icontains")
    expect(result.tokens[0].value).toBe("report")
  })

  it("should parse custom field with all symbol operators", () => {
    const testCases = [
      {input: "amount:>50", op: ">"},
      {input: "amount:>=50", op: ">="},
      {input: "amount:<50", op: "<"},
      {input: "amount:<=50", op: "<="},
      {input: "amount:=50", op: "="},
      {input: "amount:!=50", op: "!="}
    ]

    testCases.forEach(({input, op}) => {
      const result = parseTokens(input)
      expect(result.tokens[0].operator).toBe(op)
    })
  })

  it("should parse custom field with quoted value", () => {
    const input = 'description:contains "meeting notes"'
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("meeting notes")
  })

  it("should handle custom field names with underscores", () => {
    const input = "invoice_number:=12345"
    const result = parseTokens(input)

    expect(result.tokens[0].name).toBe("invoice_number")
  })

  it("should parse custom field with spaces in name (quoted)", () => {
    const input = '"Invoice Total":>100'
    const result = parseTokens(input)

    expect(result.tokens[0].name).toBe("Invoice Total")
    expect(result.tokens[0].operator).toBe(">")
    expect(result.tokens[0].value).toBe("100")
  })

  it("should parse custom field with spaces in name and value", () => {
    const input = '"Customer Name":="John Doe"'
    const result = parseTokens(input)

    expect(result.tokens[0].name).toBe("Customer Name")
    expect(result.tokens[0].operator).toBe("=")
    expect(result.tokens[0].value).toBe("John Doe")
  })

  it("should parse custom field with spaces using single quotes", () => {
    const input = "'Invoice Date':>='2024-01-01'"
    const result = parseTokens(input)

    expect(result.tokens[0].name).toBe("Invoice Date")
    expect(result.tokens[0].operator).toBe(">=")
    expect(result.tokens[0].value).toBe("2024-01-01")
  })

  it("should parse custom field with implicit = and quoted value", () => {
    const input = 'status:"in progress"'
    const result = parseTokens(input)

    expect(result.tokens[0].operator).toBe("=")
    expect(result.tokens[0].value).toBe("in progress")
  })
})

describe("tokenParser - Multiple Tokens", () => {
  it("should parse multiple tokens separated by spaces", () => {
    const input = "category:Invoice tag:urgent"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(2)
    expect(result.tokens[0].type).toBe("category")
    expect(result.tokens[1].type).toBe("tag")
  })

  it("should parse FTS with tokens", () => {
    const input = "meeting notes category:Contract tag:2024"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(3)
    expect(result.tokens[0].type).toBe("fts")
    expect(result.tokens[0].value).toBe("meeting notes")
    expect(result.tokens[1].type).toBe("category")
    expect(result.tokens[2].type).toBe("tag")
  })

  it("should parse complex query with all token types", () => {
    const input =
      "invoice category:Invoice tag:urgent tag_not:archived total:>100"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(5)
    expect(result.tokens[0].type).toBe("fts")
    expect(result.tokens[1].type).toBe("category")
    expect(result.tokens[2].type).toBe("tag")
    expect(result.tokens[3].type).toBe("tag_not")
    expect(result.tokens[4].type).toBe("custom_field")
  })

  it("should handle multiple spaces between tokens", () => {
    const input = "category:Invoice    tag:urgent"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(2)
  })

  it("should parse complex query with quoted field names", () => {
    const input =
      '"Invoice Total":>100 category:"Sales Invoice" tag:"high priority"'
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(3)
    expect(result.tokens[0].name).toBe("Invoice Total")
    expect(result.tokens[1].value).toBe("Sales Invoice")
    expect(result.tokens[2].value).toBe("high priority")
  })

  it("should parse mixed implicit and explicit equality", () => {
    const input = "status:completed amount:=100 total:>50"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(3)
    expect(result.tokens[0].operator).toBe("=") // implicit
    expect(result.tokens[1].operator).toBe("=") // explicit
    expect(result.tokens[2].operator).toBe(">")
  })
})

describe("tokenParser - Edge Cases", () => {
  it("should handle token with no value", () => {
    const input = "category:"
    const result = parseTokens(input)

    expect(result.errors.length).toBeGreaterThan(0)
  })

  it("should handle quoted strings correctly", () => {
    const input = 'category:"Sales Report" tag:"Q1 2024"'
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("Sales Report")
    expect(result.tokens[1].value).toBe("Q1 2024")
  })

  it("should handle single quotes", () => {
    const input = "category:'Annual Report'"
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("Annual Report")
  })

  it("should handle mixed quoted and unquoted values", () => {
    const input = 'category:Invoice tag:"urgent item" total:>100'
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(3)
    expect(result.tokens[1].value).toBe("urgent item")
  })

  it("should trim whitespace from values", () => {
    const input = "category: Invoice  tag: urgent "
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("Invoice")
    expect(result.tokens[1].value).toBe("urgent")
  })

  it("should handle negative numbers", () => {
    const input = "temperature:<-10"
    const result = parseTokens(input)

    expect(result.tokens[0].operator).toBe("<")
    expect(result.tokens[0].value).toBe("-10")
  })

  it("should handle decimal numbers", () => {
    const input = "price:>=99.99"
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("99.99")
  })
})

describe("tokenParser - Error Handling", () => {
  it("should continue parsing after error", () => {
    const input = "category:Invoice unknown:token tag:urgent"
    const result = parseTokens(input)

    // Should have parsed valid tokens
    expect(result.tokens.length).toBeGreaterThan(0)
  })
})

describe("tokenParser - Special Characters", () => {
  it("should handle values with hyphens", () => {
    const input = "tag:high-priority"
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("high-priority")
  })

  it("should handle values with underscores", () => {
    const input = "status:in_progress"
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("in_progress")
  })

  it("should handle values with numbers", () => {
    const input = "tag:Q1-2024"
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("Q1-2024")
  })

  it("should handle Unicode characters", () => {
    const input = "category:Rechnung"
    const result = parseTokens(input)

    expect(result.tokens[0].value).toBe("Rechnung")
  })

  it("should handle field names with numbers", () => {
    const input = "field123:=value"
    const result = parseTokens(input)

    expect(result.tokens[0].name).toBe("field123")
  })
})

describe("tokenParser - Real World Examples", () => {
  it("should parse invoice search query", () => {
    const input =
      'invoice category:"Sales Invoice" tag:urgent "Invoice Total":>1000'
    const result = parseTokens(input)

    expect(result.isValid).toBe(true)
    expect(result.tokens).toHaveLength(4)
    expect(result.tokens[0].type).toBe("fts")
    expect(result.tokens[1].type).toBe("category")
    expect(result.tokens[2].type).toBe("tag")
    expect(result.tokens[3].type).toBe("custom_field")
  })

  it("should parse document search with date range", () => {
    const input =
      '"Document Date":>="2024-01-01" "Document Date":<="2024-12-31" category:Contract'
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(3)
    expect(result.tokens[0].name).toBe("Document Date")
    expect(result.tokens[0].operator).toBe(">=")
    expect(result.tokens[1].name).toBe("Document Date")
    expect(result.tokens[1].operator).toBe("<=")
  })

  it("should parse tag combination query", () => {
    const input =
      'tag:"high priority" tag_any:blue,green,red tag_not:archived,deleted'
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(3)
    expect(result.tokens[0].type).toBe("tag")
    expect(result.tokens[1].type).toBe("tag_any")
    expect(result.tokens[2].type).toBe("tag_not")
  })

  it("should parse complex business query", () => {
    const input =
      'meeting notes category:"Quarterly Report" tag:"Q1 2024" Revenue:>1000000 Status:Approved'
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(5)
    expect(result.tokens[0].value).toBe("meeting notes")
    expect(result.tokens[3].operator).toBe(">")
    expect(result.tokens[4].operator).toBe("=") // implicit
  })

  it("should parse search with only custom fields", () => {
    const input = "total:>100 status:completed amount:<=1000"
    const result = parseTokens(input)

    expect(result.tokens).toHaveLength(3)
    expect(result.tokens[0].operator).toBe(">")
    expect(result.tokens[1].operator).toBe("=") // implicit
    expect(result.tokens[2].operator).toBe("<=")
  })
})
