import {
  Checkbox,
  ComboboxItem,
  Divider,
  Group,
  Select,
  Stack
} from "@mantine/core"
import {useEffect, useState} from "react"
import type {I18NPagesHaveChangedDialogText} from "viewer"
import {PagesHaveChangedDialog} from "viewer"

type Lang = "german" | "english"

export default function PagesHaveChangedDialogContainer() {
  const [inProgress, setInProgress] = useState<boolean>(false)
  const [opened, setOpened] = useState<boolean>(false)
  const [lang, setLang] = useState<Lang>("english")
  const [txt, setTxt] = useState<I18NPagesHaveChangedDialogText>()

  const InProgressClicked = () => {
    setInProgress(!inProgress)
  }

  const OpenedClicked = () => {
    setOpened(!opened)
  }

  const onSelect = (_value: string | null, option: ComboboxItem | null) => {
    if (option?.value) {
      setLang(option.value as Lang)
    }
  }

  useEffect(() => {
    if (lang == "german") {
      setTxt({
        pagesHaveChanged:
          "Es gibt Änderungen, wie Reihenfolge oder Drehung der Seiten, die noch nicht auf dem Server gespeichert sind. Was möchtest du tun?",
        save: "Speichern",
        reset: "Zurücksetzen",
        saveTooltip:
          "Änderungen auf den Server übernehmen. Nach dem Übernehmen erhöht sich die Dokumentversion um eins",
        resetTooltip:
          "Änderungen verwerfen. Dadurch werden die Seiten in ihren ursprünglichen Zustand zurückgesetzt (wie auf dem Server)",
        dontBotherMe: "Lass mich in Ruhe",
        dontBotherMeTooltip:
          "Diesen Modal schließen. Änderungen kannst du später über das Kontextmenü übernehmen"
      })
    } else {
      setTxt(undefined)
    }
  }, [lang])

  return (
    <Stack>
      <Group>
        <Checkbox label="In Progress" onClick={InProgressClicked} />
        <Checkbox label="Opened" onClick={OpenedClicked} />
        <Select
          label="Versions"
          placeholder="Pick a value"
          data={["english", "german"]}
          onChange={onSelect}
        />
      </Group>
      <Divider />
      <Group>
        <PagesHaveChangedDialog
          opened={opened}
          inProgress={inProgress}
          txt={txt}
        />
      </Group>
    </Stack>
  )
}
