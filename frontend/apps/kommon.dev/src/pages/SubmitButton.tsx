import {Checkbox, Group, Stack} from "@mantine/core"
import {SubmitButton} from "kommon"
import {useState} from "react"

export default function SubmitButtonContainer() {
  const [inProgress, setInProgress] = useState<boolean>(false)

  const toggleIsLoading = () => {
    setInProgress(!inProgress)
  }

  return (
    <Stack>
      <Group>
        <Checkbox label="Is Loading" onClick={toggleIsLoading} />
      </Group>
      <SubmitButton inProgress={inProgress} text={"Save"} />
    </Stack>
  )
}
