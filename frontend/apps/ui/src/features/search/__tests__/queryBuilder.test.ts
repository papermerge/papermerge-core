import {describe, it, expect} from "vitest"
import {buildSearchQuery} from "../queryBuilder"
import type {Token} from "../types"

/**
 * Query Builder Tests
 *
 * Test-Driven Development: Define expected behavior before implementation.
 *
 * The query builder converts parsed tokens into SearchQueryParams
 * that match the backend API schema exactly.
 */

describe("queryBuilder - FTS Tokens", () => {
  it("should build query with FTS token", () => {
    const tokens: Token[] = [
      {type: "fts", name: "fts", value: "invoice documents"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.fts).toEqual({
      terms: ["invoice", "documents"]
    })
  })

  it("should split FTS terms by spaces", () => {
    const tokens: Token[] = [
      {type: "fts", name: "fts", value: "meeting notes report"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.fts).toEqual({
      terms: ["meeting", "notes", "report"]
    })
  })

  it("should handle empty filters when no FTS token", () => {
    const tokens: Token[] = [
      {type: "category", name: "category", value: "Invoice"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.fts).toBeUndefined()
  })
})

describe("queryBuilder - Category Tokens", () => {
  it("should build query with single category", () => {
    const tokens: Token[] = [
      {type: "category", name: "category", value: "Invoice"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.category).toEqual({
      values: ["Invoice"]
    })
  })

  it("should build query with multiple categories", () => {
    const tokens: Token[] = [
      {type: "category", name: "category", value: ["Invoice", "Contract"]}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.category).toEqual({
      values: ["Invoice", "Contract"]
    })
  })

  it("should handle multiple category tokens by merging", () => {
    const tokens: Token[] = [
      {type: "category", name: "category", value: "Invoice"},
      {type: "category", name: "category", value: "Contract"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.category).toEqual({
      values: ["Invoice", "Contract"]
    })
  })
})

describe("queryBuilder - Tag Tokens", () => {
  it("should build query with tag (AND logic)", () => {
    const tokens: Token[] = [{type: "tag", name: "tag", value: "urgent"}]

    const result = buildSearchQuery(tokens)

    expect(result.filters.tags).toEqual([{tags: ["urgent"]}])
  })

  it("should build query with multiple tag values (AND)", () => {
    const tokens: Token[] = [
      {type: "tag", name: "tag", value: ["urgent", "2024"]}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.tags).toEqual([{tags: ["urgent", "2024"]}])
  })

  it("should build query with tag_any (OR logic)", () => {
    const tokens: Token[] = [
      {type: "tag_any", name: "tag_any", value: ["blue", "green", "red"]}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.tags).toEqual([{tags_any: ["blue", "green", "red"]}])
  })

  it("should build query with tag_not (NOT logic)", () => {
    const tokens: Token[] = [
      {type: "tag_not", name: "tag_not", value: "archived"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.tags).toEqual([{tags_not: ["archived"]}])
  })

  it("should build query with multiple tag_not values", () => {
    const tokens: Token[] = [
      {type: "tag_not", name: "tag_not", value: ["archived", "deleted"]}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.tags).toEqual([{tags_not: ["archived", "deleted"]}])
  })

  it("should handle multiple tag tokens", () => {
    const tokens: Token[] = [
      {type: "tag", name: "tag", value: "urgent"},
      {type: "tag_any", name: "tag_any", value: ["blue", "green"]},
      {type: "tag_not", name: "tag_not", value: "archived"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.tags).toEqual([
      {tags: ["urgent"]},
      {tags_any: ["blue", "green"]},
      {tags_not: ["archived"]}
    ])
  })

  it("should merge multiple tag tokens of same type", () => {
    const tokens: Token[] = [
      {type: "tag", name: "tag", value: "urgent"},
      {type: "tag", name: "tag", value: "2024"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.tags).toEqual([{tags: ["urgent", "2024"]}])
  })
})

describe("queryBuilder - Custom Field Tokens", () => {
  it("should build query with custom field (symbol operator)", () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "total", operator: ">", value: "100"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields).toEqual([
      {field_name: "total", operator: ">", value: 100}
    ])
  })

  it("should convert numeric strings to numbers", () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "amount", operator: ">=", value: "50.5"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields).toEqual([
      {field_name: "amount", operator: ">=", value: 50.5}
    ])
  })

  it("should handle integer values", () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "count", operator: "=", value: "10"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields![0].value).toBe(10)
  })

  it("should keep text values as strings", () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "status", operator: "=", value: "completed"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields).toEqual([
      {field_name: "status", operator: "=", value: "completed"}
    ])
  })

  it("should handle contains operator", () => {
    const tokens: Token[] = [
      {
        type: "custom_field",
        name: "description",
        operator: "contains",
        value: "meeting"
      }
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields).toEqual([
      {field_name: "description", operator: "contains", value: "meeting"}
    ])
  })

  it("should handle boolean values", () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "is_approved", operator: "=", value: "true"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields![0].value).toBe(true)
  })

  it("should handle multiple custom fields", () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "total", operator: ">", value: "100"},
      {type: "custom_field", name: "status", operator: "=", value: "completed"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields).toEqual([
      {field_name: "total", operator: ">", value: 100},
      {field_name: "status", operator: "=", value: "completed"}
    ])
  })

  it("should handle all comparison operators", () => {
    const operators = ["=", "!=", ">", ">=", "<", "<="] as const

    operators.forEach(op => {
      const tokens: Token[] = [
        {type: "custom_field", name: "amount", operator: op, value: "50"}
      ]

      const result = buildSearchQuery(tokens)

      expect(result.filters.custom_fields![0].operator).toBe(op)
    })
  })
})

describe("queryBuilder - Complex Queries", () => {
  it("should build complex query with all token types", () => {
    const tokens: Token[] = [
      {type: "fts", name: "fts", value: "invoice documents"},
      {type: "category", name: "category", value: "Invoice"},
      {type: "tag", name: "tag", value: "urgent"},
      {type: "tag_not", name: "tag_not", value: "archived"},
      {type: "custom_field", name: "total", operator: ">", value: "100"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.fts).toEqual({terms: ["invoice", "documents"]})
    expect(result.filters.category).toEqual({values: ["Invoice"]})
    expect(result.filters.tags).toEqual([
      {tags: ["urgent"]},
      {tags_not: ["archived"]}
    ])
    expect(result.filters.custom_fields).toEqual([
      {field_name: "total", operator: ">", value: 100}
    ])
  })

  it("should handle empty tokens array", () => {
    const tokens: Token[] = []

    const result = buildSearchQuery(tokens)

    expect(result.filters).toEqual({})
  })

  it("should include optional parameters when provided", () => {
    const tokens: Token[] = [{type: "fts", name: "fts", value: "test"}]

    const result = buildSearchQuery(tokens, {
      page_size: 20,
      page_number: 2,
      sort_by: "created_at",
      sort_direction: "desc",
      lang: "eng"
    })

    expect(result.page_size).toBe(20)
    expect(result.page_number).toBe(2)
    expect(result.sort_by).toBe("created_at")
    expect(result.sort_direction).toBe("desc")
    expect(result.lang).toBe("eng")
  })
})

describe("queryBuilder - Edge Cases", () => {
  it("should handle tokens with array values", () => {
    const tokens: Token[] = [
      {
        type: "category",
        name: "category",
        value: ["Invoice", "Contract", "Report"]
      }
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.category?.values).toEqual([
      "Invoice",
      "Contract",
      "Report"
    ])
  })

  it("should normalize whitespace in FTS terms", () => {
    const tokens: Token[] = [
      {type: "fts", name: "fts", value: "  invoice   documents  "}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.fts?.terms).toEqual(["invoice", "documents"])
  })

  it("should handle custom field with spaces in name", () => {
    const tokens: Token[] = [
      {
        type: "custom_field",
        name: "Invoice Total",
        operator: ">",
        value: "1000"
      }
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields![0].field_name).toBe("Invoice Total")
  })

  it("should handle negative numbers", () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "balance", operator: "<", value: "-100"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields![0].value).toBe(-100)
  })

  it("should handle decimal numbers", () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "price", operator: ">=", value: "99.99"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields![0].value).toBe(99.99)
  })

  it("should handle date strings as strings", () => {
    const tokens: Token[] = [
      {
        type: "custom_field",
        name: "created_date",
        operator: ">=",
        value: "2024-01-01"
      }
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields![0].value).toBe("2024-01-01")
  })
})

describe("queryBuilder - Value Type Conversion", () => {
  it('should convert "true" to boolean true', () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "active", operator: "=", value: "true"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields![0].value).toBe(true)
  })

  it('should convert "false" to boolean false', () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "active", operator: "=", value: "false"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields![0].value).toBe(false)
  })

  it("should keep non-numeric strings as strings", () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "code", operator: "=", value: "001"}
    ]

    const result = buildSearchQuery(tokens)

    // Leading zeros indicate it should stay as string
    expect(result.filters.custom_fields![0].value).toBe("001")
  })

  it("should convert scientific notation", () => {
    const tokens: Token[] = [
      {type: "custom_field", name: "amount", operator: ">", value: "1e5"}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields![0].value).toBe(100000)
  })
})

describe("queryBuilder - Real World Examples", () => {
  it("should build invoice search query", () => {
    const tokens: Token[] = [
      {type: "fts", name: "fts", value: "invoice"},
      {type: "category", name: "category", value: "Sales Invoice"},
      {type: "tag", name: "tag", value: "urgent"},
      {
        type: "custom_field",
        name: "Invoice Total",
        operator: ">",
        value: "1000"
      }
    ]

    const result = buildSearchQuery(tokens)

    expect(result).toEqual({
      filters: {
        fts: {terms: ["invoice"]},
        category: {values: ["Sales Invoice"]},
        tags: [{tags: ["urgent"]}],
        custom_fields: [
          {field_name: "Invoice Total", operator: ">", value: 1000}
        ]
      }
    })
  })

  it("should build date range query", () => {
    const tokens: Token[] = [
      {
        type: "custom_field",
        name: "Invoice Date",
        operator: ">=",
        value: "2024-01-01"
      },
      {
        type: "custom_field",
        name: "Invoice Date",
        operator: "<=",
        value: "2024-12-31"
      }
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.custom_fields).toEqual([
      {field_name: "Invoice Date", operator: ">=", value: "2024-01-01"},
      {field_name: "Invoice Date", operator: "<=", value: "2024-12-31"}
    ])
  })

  it("should build tag combination query", () => {
    const tokens: Token[] = [
      {type: "tag", name: "tag", value: "high priority"},
      {type: "tag_any", name: "tag_any", value: ["blue", "green", "red"]},
      {type: "tag_not", name: "tag_not", value: ["archived", "deleted"]}
    ]

    const result = buildSearchQuery(tokens)

    expect(result.filters.tags).toEqual([
      {tags: ["high priority"]},
      {tags_any: ["blue", "green", "red"]},
      {tags_not: ["archived", "deleted"]}
    ])
  })
})
