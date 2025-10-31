import type {TokenType} from "./types"

function getKnownTokenWithColumn(text: string): TokenType | null {
  if (!text.includes(":")) {
    return null
  }
  if (text == "tag:" || text == "tag_all:" || text == "tall:") {
    return "tag"
  }

  if (text == "cat:" || text == "category:") {
    return "category"
  }

  if (text == "cf:" || text == "custom_field:" || text == "customfield:") {
    return "custom_field"
  }

  if (text == "tag_not:" || text == "tagnot:" || text == "tnot:") {
    return "tag_not"
  }

  if (text == "tag_any:" || text == "tany:" || text == "tagany:") {
    return "tag_not"
  }

  return null
}

export {getKnownTokenWithColumn}
