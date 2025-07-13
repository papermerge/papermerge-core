import {Button, ComboboxItem, Group, Select} from "@mantine/core"
import {
  SupportedFilesInfoModal,
  type I18NSupportedFilesInfoModal
} from "commander"
import {useEffect, useState} from "react"

type Lang = "german" | "english"

export default function SupportedFilesInfoModalContainer() {
  const [opened, setOpened] = useState<boolean>(false)
  const [lang, setLang] = useState<Lang>("english")
  const [txt, setTxt] = useState<I18NSupportedFilesInfoModal>()

  const onSelect = (_value: string | null, option: ComboboxItem | null) => {
    if (option?.value) {
      setLang(option.value as Lang)
    }
  }

  useEffect(() => {
    if (lang == "german") {
      setTxt({
        title: "Unterstützte Dateien",
        close: "Schließen",
        supportedFiles:
          "Du kannst PDF-, PNG-, JPEG- oder TIFF-Dateien hochladen.",
        allowedExtentions: "Erlaubte Dateiendungen:",
        caseSensitivity: "Groß- und Kleinschreibung spielt keine Rolle."
      })
    } else {
      setTxt(undefined)
    }
  }, [lang])

  return (
    <>
      <Group>Supported Files Info Modal</Group>
      <Group>
        <Button onClick={() => setOpened(true)}>Open</Button>
        <Select
          label="Versions"
          placeholder="Pick a value"
          data={["english", "german"]}
          onChange={onSelect}
        />
      </Group>

      <SupportedFilesInfoModal
        opened={opened}
        onClose={() => setOpened(false)}
        supportedExtentions={[".tiff", ".png"]}
        txt={txt}
      />
    </>
  )
}
