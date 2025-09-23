import {Button, ButtonProps} from "@mantine/core"
import {TFunction} from "i18next"

interface Args extends ButtonProps {
  t?: TFunction
  onClick?: () => void
}

export default function CancelButton({t, onClick}: Args) {
  return (
    <Button onClick={onClick}>
      {t?.("cancel", {defaultValue: "Cancel"}) || "Cancel"}
    </Button>
  )
}
