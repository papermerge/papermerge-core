import {Group} from "@mantine/core"

import ToggleCompactModeButton from "@/features/search/components/ToggleCompactModeButton"

import ClearButton from "./ClearButon"
import SearchCompactSummary from "./CompactSummary"

interface Args {
  tokensCount: number
  showClearButton: boolean
  handleClearAll: () => void
  toggleCompactModeHandler: () => void
}

export default function SearchFiltersCompactSummary({
  showClearButton,
  handleClearAll,
  toggleCompactModeHandler,
  tokensCount
}: Args) {
  return (
    <Group justify="space-between" w="100%">
      <SearchCompactSummary tokensCount={tokensCount} />
      <Group>
        <ToggleCompactModeButton
          isCompactMode={true}
          onClick={toggleCompactModeHandler}
        />
        {showClearButton && <ClearButton onClick={handleClearAll} />}
      </Group>
    </Group>
  )
}
