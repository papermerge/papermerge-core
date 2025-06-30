import {Button, Loader} from "@mantine/core"

interface Args {
  inProgress: boolean
  text: string
  onClick: () => void
  color: string
}

export default function SubmitButton({inProgress, text, onClick, color}: Args) {
  if (inProgress) {
    return (
      <Button disabled={true} color={color}>
        <Loader />
      </Button>
    )
  }

  return (
    <Button onClick={onClick} color={color}>
      {text}
    </Button>
  )
}
