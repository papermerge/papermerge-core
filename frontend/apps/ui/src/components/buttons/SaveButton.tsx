import {Button, ButtonProps} from "@mantine/core"
import {TFunction} from "i18next"

interface Args extends ButtonProps {
  t?: TFunction
  onClick?: () => void
}

export default function SaveButton({t, onClick}: Args) {
  return (
    <Button onClick={onClick}>
      {t?.("save", {defaultValue: "Save"}) || "Save"}
    </Button>
  )
}
