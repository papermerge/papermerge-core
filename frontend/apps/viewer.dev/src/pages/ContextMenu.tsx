import {Group, NumberInput, Stack} from "@mantine/core"
import {useEffect, useState} from "react"
import {ContextMenu} from "viewer"

type Coord = {
  x: number
  y: number
}

export default function ContextMenuPage() {
  const [x, setX] = useState<number | string>(200)
  const [y, setY] = useState<number | string>(200)
  const [pos, setPos] = useState<Coord>({x: 200, y: 200})

  useEffect(() => {
    setPos({
      x: typeof x === "number" ? x : parseInt(x) || 0,
      y: typeof y === "number" ? y : parseInt(y) || 0
    })
  }, [x, y])

  return (
    <Stack>
      <Group>
        <NumberInput
          step={30}
          min={100}
          max={2000}
          defaultValue={200}
          value={x}
          onChange={setX}
        />
        <NumberInput
          step={30}
          min={100}
          max={2000}
          defaultValue={200}
          value={y}
          onChange={setY}
        />
      </Group>
      <ContextMenu position={pos} opened={true} />
    </Stack>
  )
}
