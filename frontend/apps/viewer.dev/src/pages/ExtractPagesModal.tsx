import {Button, Checkbox, ComboboxItem, Group, Select} from "@mantine/core"
import {useEffect, useState} from "react"
import {ExtractPagesModal, type I18NExtractPagesModal} from "viewer"

type Lang = "german" | "english"

export default function ExtractPagesModalContainer() {
  const [inProgress, setInProgress] = useState<boolean>(false)
  const [opened, setOpened] = useState<boolean>(false)
  const [lang, setLang] = useState<Lang>("english")
  const [txt, setTxt] = useState<I18NExtractPagesModal>()

  const InProgressClicked = () => {
    setInProgress(!inProgress)
  }

  const onSelect = (_value: string | null, option: ComboboxItem | null) => {
    if (option?.value) {
      setLang(option.value as Lang)
    }
  }

  useEffect(() => {
    if (lang == "german") {
      setTxt({
        title: "Seiten extrahieren",
        yesExtract: "Ja, extrahiere die Seiten",
        cancel: "Abrechen",
        titleFormatLabel: "Titelformat",
        mainBodyText: "Möchtest du Seiten extrahiren?",
        checkboxExtractIntoSeparateDocLabel:
          "Jede Seite in ein separates Dokument extrahieren",
        titleFormatDescription:
          "Die extrahierten Seiten werden in Dokument(e) mit dem Titel mydoc-[ID].pdf gespeichert"
      })
    } else {
      setTxt(undefined)
    }
  }, [lang])

  return (
    <>
      <Group>Extract Pages Modal</Group>
      <Group>
        <Checkbox label="In Progress" onClick={InProgressClicked} />
        <Button onClick={() => setOpened(true)}>Open</Button>
        <Select
          label="Versions"
          placeholder="Pick a value"
          data={["english", "german"]}
          onChange={onSelect}
        />
      </Group>

      <ExtractPagesModal
        opened={opened}
        separateDocs={true}
        inProgress={inProgress}
        titleFormat={"mydoc"}
        onCancel={() => setOpened(false)}
        txt={txt}
      />
    </>
  )
}
