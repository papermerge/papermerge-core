import NewButton from "@/components/NewButton"
import {useTranslation} from "react-i18next"

interface Args {
  onClick: () => void
}

export default function NewButtonContainer({onClick}: Args) {
  const {t} = useTranslation()

  return (
    <>
      <NewButton
        onClick={onClick}
        text={t("api_tokens.create", {defaultValue: "Create Token"})}
      />
    </>
  )
}
