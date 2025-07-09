import {Button, Checkbox, ComboboxItem, Group, Select} from "@mantine/core"
import {useEffect, useState} from "react"
import type {I18NTransferPagesModal} from "viewer"
import {TransferPagesModal} from "viewer"

type Lang = "german" | "english"

export default function TransferPagesModalContainer() {
  const [inProgress, setInProgress] = useState<boolean>(false)
  const [opened, setOpened] = useState<boolean>(false)
  const [lang, setLang] = useState<Lang>("english")
  const [txt, setTxt] = useState<I18NTransferPagesModal>()

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
        title: "Ausgewählte Seiten übertragen",
        yesTransfer: "Ja, übertrage die Seiten",
        cancel: "Abrechen",
        mixLabel: "Seiten mischen",
        replaceLabel: "Seiten ersetzen",
        mainBodyText: "Möchtest du Seiten übertragen?",
        strategyLabel: "Transferstrategie"
      })
    } else {
      setTxt(undefined)
    }
  }, [lang])

  return (
    <>
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

      <TransferPagesModal
        opened={opened}
        value={{value: "mix", label: "Mix"}}
        inProgress={inProgress}
        onCancel={() => setOpened(false)}
        txt={txt}
      />
    </>
  )
}
