import {
  ScannerError,
  ScanResult,
  ParseSegmentResult,
  Token,
  TagOperator,
  CategoryOperator,
  SuggestionResult,
  FilterType,
  TagToken
} from "./types"
import {
  segmentInput,
  isSpaceSegment,
  splitByColon,
  removeQuotes,
  getTagValueItemsFilter,
  getTagValueItemsToExclude
} from "./utils"

import {FILTERS, TAG_IMPLICIT_OPERATOR} from "./const"

export function scanSearchText(input: string): ScanResult {
  const tokens: Token[] = []
  const errors: ScannerError[] = []

  if (!input.trim()) {
    return {
      tokens: [],
      hasSuggestions: true,
      suggestions: [
        {
          type: "filter",
          items: FILTERS.sort()
        }
      ]
    }
  }

  // Split input into segments, preserving quoted strings
  const {segments, nonEmptyInputCompletedWithSpace} = segmentInput(input)
  let i = 0

  while (i < segments.length) {
    const segment = segments[i]
    if (i == segments.length - 1) {
      // last segment, which may mean
      // that user is still typing it
      const {token, tokenIsComplete, hasSuggestions, suggestions} =
        parseSegment(segment, nonEmptyInputCompletedWithSpace)
      if (tokenIsComplete && token) {
        tokens.push(token)
      }

      return {
        tokens,
        hasSuggestions,
        suggestions
      }
    }
    i++
  }

  return {
    tokens,
    hasSuggestions: false
  }
}

export function parseSegment(
  segment: string,
  nonEmptyInputCompletedWithSpace: boolean
): ParseSegmentResult {
  if (isSpaceSegment(segment)) {
    const token = {
      type: "space" as const,
      count: segment.length,
      raw: segment
    }
    return {
      token,
      tokenIsComplete: true,
      hasSuggestions: true,
      suggestions: [
        {
          type: "filter",
          items: FILTERS.sort()
        }
      ]
    }
  }

  if (!segment.includes(":")) {
    // user typed some non empty characters (but without a column)
    const {hasSuggestions, suggestions} = getFilterSuggestions(segment)
    return {
      tokenIsComplete: false,
      hasSuggestions,
      suggestions
    }
  }

  const parts = splitByColon(segment)
  if (parts.length == 2) {
    //cf, tag, category, title, owner etc
    const {hasSuggestions, suggestions, token, tokenIsComplete} =
      parseTwoPartsSegment(
        parts[0] as FilterType,
        parts[1],
        nonEmptyInputCompletedWithSpace
      )
    return {
      token,
      tokenIsComplete,
      hasSuggestions,
      suggestions
    }
  }

  if (parts.length == 3) {
    if (parts[0] == "tag") {
      // part[0] == "tag"
      // part[1] == any | all | not i.e. operator
      // part[2] == values:
      //
      //    1. inv
      //    2. invoice,
      //    3. "blue sky"
      //    4. "big fat invoice","blue sky",important,
      const {hasSuggestions, suggestions, token, tokenIsComplete} =
        parseThreePartsTagSegment(parts[1], parts[1], parts[2])
      return {
        token,
        tokenIsComplete,
        hasSuggestions,
        suggestions
      }
    }

    if (parts[0] == "cat") {
      const {hasSuggestions, suggestions, token, tokenIsComplete} =
        parseThreePartsCatSegment(parts[1], parts[1], parts[2])
      return {
        token,
        tokenIsComplete,
        hasSuggestions,
        suggestions
      }
    }
  }

  return {
    hasSuggestions: false,
    tokenIsComplete: false
  }
}

export function getAllFiltersSuggestion(): SuggestionResult {
  return {
    tokenIsComplete: false,
    hasSuggestions: true,
    suggestions: [
      {
        type: "filter",
        items: FILTERS.sort()
      }
    ]
  }
}

export function getFilterSuggestions(text: string): SuggestionResult {
  const matches = FILTERS.filter(k => k.startsWith(text))

  if (matches.length > 0) {
    return {
      tokenIsComplete: false,
      hasSuggestions: true,
      suggestions: [
        {
          type: "filter",
          items: matches.sort()
        }
      ]
    }
  }

  return {
    tokenIsComplete: false,
    hasSuggestions: false
  }
}

export function parseTwoPartsSegment(
  part1: FilterType,
  part2: string,
  nonEmptyInputCompletedWithSpace: boolean
): SuggestionResult {
  if (part1 == "tag") {
    const tagItemsToExclude = getTagValueItemsToExclude(part2)
    const tagItemsFilter = getTagValueItemsFilter(part2)

    const all_tag_operators = ["all:", "any:", "not:"]
    const all_filtered_operators = all_tag_operators.filter(op =>
      op.startsWith(part2)
    )
    const operators = part2 != "" ? all_filtered_operators : all_tag_operators
    let token: TagToken = {
      type: "tag"
    }

    if (nonEmptyInputCompletedWithSpace) {
      /**
       *  user typed "tag:invoice " i.e. with space at the end
       *  signaling that he/she wants to proceed with next filter
       * */
      token.operator = TAG_IMPLICIT_OPERATOR
      token.values = part2.split(",").map(t => removeQuotes(t))
      return {
        token: token,
        tokenIsComplete: true,
        hasSuggestions: true,
        suggestions: [
          {
            type: "filter",
            items: FILTERS.sort()
          }
        ]
      }
    }

    return {
      token: token,
      tokenIsComplete: false,
      hasSuggestions: true,
      suggestions: [
        {
          type: "operator",
          items: operators.sort()
        },
        {
          type: "tag",
          filter: tagItemsFilter,
          exclude: tagItemsToExclude
        }
      ]
    }
  }

  if (part1 == "cat") {
    const catItemsToExclude = getTagValueItemsToExclude(part2)
    const catItemsFilter = getTagValueItemsFilter(part2)

    const all_cat_operators = ["any:", "not:"]
    const all_filtered_operators = all_cat_operators.filter(op =>
      op.startsWith(part2)
    )
    const operators = part2 != "" ? all_filtered_operators : all_cat_operators
    return {
      token: {
        type: "cat"
      },
      tokenIsComplete: false,
      hasSuggestions: true,
      suggestions: [
        {
          type: "operator",
          items: operators.sort()
        },
        {
          type: "category",
          filter: catItemsFilter,
          exclude: catItemsToExclude
        }
      ]
    }
  }

  if (part1 == "cf") {
    const cfItemsToExclude = getTagValueItemsToExclude(part2)
    const cfItemsFilter = getTagValueItemsFilter(part2)

    return {
      token: {
        type: "cf"
      },
      tokenIsComplete: false,
      hasSuggestions: true,
      suggestions: [
        {
          type: "customField",
          filter: cfItemsFilter,
          exclude: cfItemsToExclude
        }
      ]
    }
  }

  return {
    hasSuggestions: false,
    tokenIsComplete: false
  }
}

export function parseThreePartsTagSegment(
  _: string,
  part2: string,
  part3: string
): SuggestionResult {
  const trimmedValues = part3.trim()
  if (trimmedValues.length == 0) {
    return {
      token: {
        type: "tag",
        operator: part2 as TagOperator
      },
      tokenIsComplete: false,
      hasSuggestions: true,
      suggestions: [
        {
          type: "tag"
        }
      ]
    }
  }

  const itemsToExclude = getTagValueItemsToExclude(part3)
  const itemsFilter = getTagValueItemsFilter(part3)

  return {
    hasSuggestions: true,
    token: {
      type: "tag",
      operator: part2 as TagOperator,
      values: part3.split(",").map(t => removeQuotes(t))
    },
    tokenIsComplete: false,
    suggestions: [
      {
        type: "tag",
        filter: itemsFilter,
        exclude: itemsToExclude
      }
    ]
  }
}

export function parseThreePartsCatSegment(
  _: string,
  part2: string,
  part3: string
): SuggestionResult {
  const trimmedValues = part3.trim()
  if (trimmedValues.length == 0) {
    return {
      token: {
        type: "cat",
        operator: part2 as CategoryOperator
      },
      tokenIsComplete: false,
      hasSuggestions: true,
      suggestions: [
        {
          type: "category"
        }
      ]
    }
  }

  const itemsToExclude = getTagValueItemsToExclude(part3)
  const itemsFilter = getTagValueItemsFilter(part3)

  return {
    hasSuggestions: true,
    token: {
      type: "cat",
      operator: part2 as CategoryOperator,
      values: part3.split(",").map(t => removeQuotes(t))
    },
    tokenIsComplete: false,
    suggestions: [
      {
        type: "category",
        filter: itemsFilter,
        exclude: itemsToExclude
      }
    ]
  }
}
