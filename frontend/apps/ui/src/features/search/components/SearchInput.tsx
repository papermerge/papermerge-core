import ConditionalTooltip from "@/components/ConditionalTooltip"
import {Group, TextInput} from "@mantine/core"
import type {ChangeEvent, KeyboardEvent} from "react"
import {RefObject} from "react"
import EnterKeyButton from "./EnterKeyButton"

import styles from "./Search.module.css"

interface Args {
  inputRef: RefObject<HTMLInputElement | null>
  validationError: string
  inputValue: string
  isInputValid: boolean
  handleInputFocus: () => void
  handleInputBlur: () => void
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  handleSubmitClick: () => void
}

export default function SearchInput({
  inputRef,
  validationError,
  isInputValid,
  inputValue,
  handleInputFocus,
  handleInputBlur,
  handleInputChange,
  handleSubmitClick,
  handleKeyDown
}: Args) {
  return (
    <Group className={styles.inputWrapper}>
      <ConditionalTooltip
        showTooltipIf={validationError.length > 0}
        tooltipProps={{
          label: `⚠️ ${validationError}`,
          withArrow: true,
          opened: true,
          position: "top-start",
          arrowOffset: 5,
          arrowSize: 7
        }}
      >
        <TextInput
          ref={inputRef}
          variant="unstyled"
          placeholder="Search..."
          value={inputValue}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onChange={event => {
            handleInputChange(event)
          }}
          onKeyDown={handleKeyDown}
          className={styles.inputField}
          classNames={{
            input: validationError ? styles.inputError : undefined
          }}
        />
      </ConditionalTooltip>
      {isInputValid && <EnterKeyButton onClick={handleSubmitClick} />}
    </Group>
  )
}
