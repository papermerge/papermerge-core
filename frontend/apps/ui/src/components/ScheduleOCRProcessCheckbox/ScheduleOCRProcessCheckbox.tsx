import {useRuntimeConfig} from "@/hooks/runtime_config"
import {OCRCode} from "@/types/ocr"
import {langCodes2ComboboxData} from "@/utils"
import {Checkbox, Select, Stack} from "@mantine/core"
import {useState} from "react"

interface Args {
  initialCheckboxValue: boolean
  defaultLang: OCRCode
  onLangChange: (newLang: OCRCode) => void
  onCheckboxChange: (newValue: boolean) => void
}

export default function ScheduleOCRProcessCheckbox({
  initialCheckboxValue,
  defaultLang,
  onCheckboxChange,
  onLangChange
}: Args) {
  const runtimeConfig = useRuntimeConfig()
  const langData = langCodes2ComboboxData(runtimeConfig.ocr__lang_codes)
  const [checked, setChecked] = useState<boolean>(initialCheckboxValue)
  const [lang, setLang] = useState<OCRCode>(defaultLang)

  const onCheckboxChangeLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.currentTarget.checked
    setChecked(newValue)
    onCheckboxChange(newValue)
  }
  const onLangChangeLocal = (value: string | null) => {
    if (value) {
      setLang(value as OCRCode)
      onLangChange(value as OCRCode)
    }
  }

  return (
    <Stack my={"md"}>
      <Checkbox
        mt="md"
        mb="md"
        label="Schedule OCR processing"
        checked={checked}
        onChange={onCheckboxChangeLocal}
      />
      {checked && (
        <Select
          searchable
          defaultValue={defaultLang}
          onChange={onLangChangeLocal}
          data={langData}
          value={lang}
        />
      )}
    </Stack>
  )
}
