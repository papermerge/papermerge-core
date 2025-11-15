import {
  CategoryOperator,
  CategoryToken,
  CustomFieldOperator,
  CustomFieldToken,
  FilterToken,
  FreeTextToken,
  LexerResult,
  ParseError,
  ParseExtraData,
  ParseResult,
  SearchSuggestion,
  TagOperator,
  TagToken,
  Token
} from "./types"
import {
  getTokenValueItemsFilter,
  getTokenValueItemsToExclude,
  removeQuotes,
  splitByColon
} from "./utils"

import {FILTERS, OPERATOR_NUMERIC, OPERATOR_TEXT} from "./const"

// ===========================
// LEXER (Tokenization)
// ===========================

function lex(input: string): LexerResult {
  const hasTrailingSemicolon = input.trimEnd().endsWith(";")
  const tokens = input
    .split(";")
    .map(s => s.trim())
    .filter(s => s.length > 0)

  return {tokens, hasTrailingSemicolon}
}

// ===========================
// PARSER (Syntax Analysis)
// ===========================

export function parse(input: string, extra?: ParseExtraData): ParseResult {
  const {tokens: rawTokens, hasTrailingSemicolon} = lex(input)

  const parsedTokens: Token[] = []
  const errors: ParseError[] = []

  // Parse all tokens except possibly the last one
  const tokensToParseCount = hasTrailingSemicolon
    ? rawTokens.length
    : rawTokens.length - 1

  for (let i = 0; i < tokensToParseCount; i++) {
    try {
      const token = parseToken(rawTokens[i])
      parsedTokens.push(token)
    } catch (e) {
      errors.push({
        message: e.message,
        token: rawTokens[i],
        position: i
      })
    }
  }

  // Handle incomplete token (user still typing)
  const currentToken = hasTrailingSemicolon
    ? undefined
    : rawTokens[rawTokens.length - 1]

  const suggestions = currentToken
    ? getSuggestions(currentToken, extra)
    : getAllFilterSuggestions()

  return {
    tokens: parsedTokens,
    currentToken,
    isComplete: hasTrailingSemicolon && errors.length === 0,
    suggestions,
    hasSuggestions: suggestions.length > 0,
    errors
  }
}

// ===========================
// TOKEN PARSER
// ===========================

function parseToken(tokenStr: string): Token {
  // Rule: FreeTextToken | FilterToken

  if (!tokenStr.includes(":")) {
    return parseFreeTextToken(tokenStr)
  }

  return parseFilterToken(tokenStr)
}

function parseFreeTextToken(text: string): FreeTextToken {
  return {
    type: "fts",
    value: removeQuotes(text),
    raw: text
  }
}

function parseFilterToken(tokenStr: string): FilterToken {
  // Rule: FilterToken ::= CustomFieldFilter | TagFilter | CategoryFilter | SimpleFilter

  const parts = splitByColon(tokenStr)

  // Match CustomFieldFilter: "cf" ":" CustomFieldName ":" ComparisonOp ":" Value
  if (parts[0] === "cf") {
    return parseCustomFieldFilter(parts, tokenStr)
  }

  // Match TagFilter: "tag" ":" ...
  if (parts[0] === "tag") {
    return parseTagFilter(parts, tokenStr)
  }

  // Match CategoryFilter: "cat" ":" ...
  if (parts[0] === "cat") {
    return parseCategoryFilter(parts, tokenStr)
  }

  // add other filters here BEGIN
  //
  // if (parts[0] == "XYZ") {
  //  return parseXYZFilter(parts, tokenStr)
  // }
  //
  // add other filters here END

  throw new SyntaxError(`Unknown filter token: ${parts[0]}`)
}

// ===========================
// CUSTOM FIELD FILTER
// ===========================

function parseCustomFieldFilter(
  parts: string[],
  raw: string
): CustomFieldToken {
  // Rule: "cf" ":" CustomFieldName ":" ComparisonOp ":" Value

  if (parts.length !== 4) {
    throw new SyntaxError(
      `Custom field filter expects 4 parts (cf:name:op:value), got ${parts.length}`
    )
  }

  const [, fieldName, operator, value] = parts

  validateComparisonOperator(operator)

  return {
    type: "cf",
    fieldName: removeQuotes(fieldName.trim()),
    operator: operator as CustomFieldOperator,
    value: removeQuotes(value.trim()),
    raw
  }
}

function validateComparisonOperator(op: string): void {
  const valid = [">", "<", ">=", "<=", "=", "!="]
  if (!valid.includes(op)) {
    throw new SyntaxError(
      `Invalid comparison operator '${op}'. Valid: ${valid.join(", ")}`
    )
  }
}

// ===========================
// TAG FILTER
// ===========================

function parseTagFilter(parts: string[], raw: string): TagToken {
  // Rule: TagFilter ::= "tag" ":" TagOp ":" ValueList
  //                   | "tag" ":" ValueList

  if (parts.length === 2) {
    // "tag" ":" ValueList (implicit 'all')
    return {
      type: "tag",
      operator: "all",
      operatorIsImplicit: true,
      values: parseValueList(parts[1]),
      raw
    }
  }

  if (parts.length === 3) {
    // "tag" ":" TagOp ":" ValueList
    const operator = parts[1]
    validateTagOperator(operator)

    return {
      type: "tag",
      operator: operator as TagOperator,
      operatorIsImplicit: false,
      values: parseValueList(parts[2]),
      raw
    }
  }

  throw new SyntaxError(`Tag filter expects 2 or 3 parts, got ${parts.length}`)
}

function validateTagOperator(op: string): void {
  const valid = ["any", "all", "not"]
  if (!valid.includes(op)) {
    throw new SyntaxError(
      `Invalid tag operator '${op}'. Valid: ${valid.join(", ")}`
    )
  }
}

// ===========================
// CATEGORY FILTER
// ===========================

function parseCategoryFilter(parts: string[], raw: string): CategoryToken {
  // Rule: CategoryFilter ::= "cat" ":" CategoryOp ":" ValueList
  //                        | "cat" ":" ValueList

  if (parts.length === 2) {
    // "cat" ":" ValueList (implicit 'any')
    return {
      type: "cat",
      operator: "any",
      operatorIsImplicit: true,
      values: parseValueList(parts[1]),
      raw
    }
  }

  if (parts.length === 3) {
    // "cat" ":" CategoryOp ":" ValueList
    const operator = parts[1]
    validateCategoryOperator(operator)

    return {
      type: "cat",
      operator: operator as CategoryOperator,
      operatorIsImplicit: false,
      values: parseValueList(parts[2]),
      raw
    }
  }

  throw new SyntaxError(
    `Category filter expects 2 or 3 parts, got ${parts.length}`
  )
}

function validateCategoryOperator(op: string): void {
  const valid = ["any", "not"]
  if (!valid.includes(op)) {
    throw new SyntaxError(
      `Invalid category operator '${op}'. Valid: ${valid.join(", ")}`
    )
  }
}

// ===========================
// VALUE LIST PARSING
// ===========================

function parseValueList(valuesStr: string): string[] {
  // Rule: ValueList ::= Value ("," Value)*

  if (!valuesStr.trim()) {
    throw new SyntaxError("Value list cannot be empty")
  }

  return valuesStr
    .split(",")
    .map(v => v.trim())
    .map(v => removeQuotes(v))
    .filter(v => v.length > 0)
}

export function getAllFilterSuggestions(): SearchSuggestion[] {
  return [
    {
      type: "filter",
      items: FILTERS.sort()
    }
  ]
}

/**
 * `text` here is what is user currently typing
 *
 * filter1 ; filter2 ; fil
 *                     ^^^ what is user currently typing
 *                     ^^^ there is no ";" at the end
 *
 * i.e. it may be incomplete filter
 */
export function getSuggestions(
  text: string,
  extra?: ParseExtraData
): SearchSuggestion[] {
  const parts = splitByColon(text)

  if (parts.length == 1) {
    // Here we are outside any filter context
    // it can be either free text or prefix of filter name
    // e.g.
    //
    //  1. ta                    -> tag filter prefix
    //  2. some free text tatata -> just free text
    //  3. tag                   -> tag filter prefix
    //  4. bogota                -> just free text
    const matches = FILTERS.filter(k => k.startsWith(text))

    if (matches.length > 0) {
      return [
        {
          type: "filter",
          items: matches.sort()
        }
      ]
    }
    // user is typing just free text, nothing to suggest
    return []
  }

  if (parts[0] === "cf") {
    return getCustomFieldSuggestions(parts, text, extra)
  }

  // Match TagFilter: "tag" ":" ...
  if (parts[0] === "tag") {
    return getTagSuggestions(parts, text)
  }

  // Match CategoryFilter: "cat" ":" ...
  if (parts[0] === "cat") {
    return getCategorySuggestions(parts, text)
  }

  // add other suggestions here BEGIN
  //
  // if (parts[0] == "XYZ") {
  //  return getXYZSuggestions(parts, text)
  // }
  //
  // add other suggestions here END

  return []
}

function getCustomFieldSuggestions(
  parts: string[],
  raw: string,
  extra?: ParseExtraData
): SearchSuggestion[] {
  if (parts[0] != "cf") {
    throw new Error(
      `Failed assumption expected 'cat' found ${parts[0]}; raw=${raw}`
    )
  }
  ////////////////////////
  if (parts.length == 2) {
    // i.e. cf:blah or maybe cf:blah
    const part2 = parts[1].trim()
    const catValueItemsToExclude = getTokenValueItemsToExclude(part2)
    const catValueItemsFilter = getTokenValueItemsFilter(part2)
    return [
      {
        type: "customField",
        filter: catValueItemsFilter,
        exclude: catValueItemsToExclude
      }
    ]
  }
  /////////////////////////////
  if (parts.length == 3) {
    // i.e. cf:Total EUR:
    if (!extra) {
      return []
    }

    if (extra.suggestionType != "customField") {
      return []
    }

    if (!extra.typeHandler) {
      return []
    }

    if (["float", "int", "monetary", "date"].includes(extra.typeHandler)) {
      return [
        {
          type: "operator",
          items: OPERATOR_NUMERIC
        }
      ]
    }

    if (extra.typeHandler == "text") {
      return [{type: "operator", items: OPERATOR_TEXT}]
    }
  } // END of parts.lenth == 3
  ////////////////////////////////////
  if (parts.length == 4) {
    // i.e. cf:Datum:>:
    //                  ^ user is typing here
    if (!extra) {
      return []
    }

    if (extra.suggestionType != "customField") {
      return []
    }

    if (extra.typeHandler == "date") {
      return [
        {
          type: "calendarDate"
        }
      ]
    }
  }
  ///////////////////////////////////

  return []
}

function getTagSuggestions(parts: string[], raw: string): SearchSuggestion[] {
  if (parts[0] != "tag") {
    throw new Error(
      `Failed assumption expected 'tag' found ${parts[0]}; raw=${raw}`
    )
  }

  if (parts.length == 2) {
    // i.e. tag:blah or maybe tag:blah, blah
    // At this point it is not possible to tell if user it typing
    // a tag operator i.e. tag:any (thus intention would be tag:any:invoice)
    // or user intends to type tag value e.g. tag:invoice
    const part2 = parts[1].trim()
    const tagValueItemsToExclude = getTokenValueItemsToExclude(part2)
    const tagValueItemsFilter = getTokenValueItemsFilter(part2)

    const all_tag_operators = ["all:", "any:", "not:"]
    const all_filtered_operators = all_tag_operators.filter(op =>
      op.startsWith(part2)
    )
    const operators = part2 != "" ? all_filtered_operators : all_tag_operators

    return [
      {
        type: "operator",
        items: operators.sort()
      },
      {
        type: "tag",
        filter: tagValueItemsFilter,
        exclude: tagValueItemsToExclude
      }
    ]
  }

  if (parts.length == 3) {
    // at this point it is sure thing that user is typing tag values
    const part3 = parts[2].trim()
    const tagValueItemsToExclude = getTokenValueItemsToExclude(part3.trim())
    const tagValueItemsFilter = getTokenValueItemsFilter(part3)
    return [
      {
        type: "tag",
        filter: tagValueItemsFilter,
        exclude: tagValueItemsToExclude
      }
    ]
  }

  return []
}

function getCategorySuggestions(
  parts: string[],
  raw: string
): SearchSuggestion[] {
  if (parts[0] != "cat") {
    throw new Error(
      `Failed assumption expected 'cat' found ${parts[0]}; raw=${raw}`
    )
  }

  if (parts.length == 2) {
    // i.e. cat:blah or maybe cat:blah, blah
    // At this point it is not possible to tell if user it typing
    // a cat operator i.e. cat:any (thus intention would be cat:any:letter)
    // or user intends to type category value e.g. cat:letter
    const part2 = parts[1].trim()
    const catValueItemsToExclude = getTokenValueItemsToExclude(part2)
    const catValueItemsFilter = getTokenValueItemsFilter(part2)

    const all_category_operators = ["any:", "not:"]
    const all_filtered_operators = all_category_operators.filter(op =>
      op.startsWith(part2)
    )
    const operators =
      part2 != "" ? all_filtered_operators : all_category_operators

    return [
      {
        type: "operator",
        items: operators.sort()
      },
      {
        type: "category",
        filter: catValueItemsFilter,
        exclude: catValueItemsToExclude
      }
    ]
  }

  if (parts.length == 3) {
    // at this point it is sure thing that user is typing category values
    const part3 = parts[2].trim()
    const catValueItemsToExclude = getTokenValueItemsToExclude(part3.trim())
    const catValueItemsFilter = getTokenValueItemsFilter(part3)
    return [
      {
        type: "category",
        filter: catValueItemsFilter,
        exclude: catValueItemsToExclude
      }
    ]
  }

  return []
}
