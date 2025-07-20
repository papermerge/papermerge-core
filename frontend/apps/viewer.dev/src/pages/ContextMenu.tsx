import {
  Button,
  Checkbox,
  ComboboxItem,
  Group,
  NumberInput,
  Select,
  Stack
} from "@mantine/core"
import {useEffect, useState} from "react"
import type {MoveDocumentDirection} from "viewer"
import {ContextMenu} from "viewer"

const INITIAL_POS_X = 200
const INITIAL_POS_Y = 200
const STEP = 30
const MIN = 100
const MAX = 2000

type Coord = {
  x: number
  y: number
}

export default function ContextMenuPage() {
  const [opened, setOpened] = useState<boolean>(false)
  const [showRotate, setShowRotate] = useState<boolean>(false)
  const [showViewOCRText, setShowViewOCRText] = useState<boolean>(false)
  const [showDeletePages, setShowDeletePages] = useState<boolean>(false)
  const [showDeleteDocument, setShowDeleteDocument] = useState<boolean>(false)
  const [showResetChanges, setShowResetChanges] = useState<boolean>(false)
  const [showSaveChanges, setShowSaveChanges] = useState<boolean>(false)
  const [showMoveDocument, setShowMoveDocument] = useState<
    MoveDocumentDirection | undefined
  >()
  const [showMoveDocumentChecked, setShowMoveDocumentChecked] =
    useState<boolean>(false)
  const [showExtractPagesChecked, setShowExtractPagesChecked] =
    useState<boolean>(false)
  const [showExtractPages, setShowExtractPages] = useState<
    MoveDocumentDirection | undefined
  >()
  const [direction, setDirection] = useState<MoveDocumentDirection>("left")

  const [x, setX] = useState<number | string>(INITIAL_POS_X)
  const [y, setY] = useState<number | string>(INITIAL_POS_Y)
  const [pos, setPos] = useState<Coord>({x: INITIAL_POS_X, y: INITIAL_POS_Y})

  const onDirectionChange = (
    _value: string | null,
    option: ComboboxItem | null
  ) => {
    if (option?.value) {
      setDirection(option.value as MoveDocumentDirection)
    }
  }

  useEffect(() => {
    setPos({
      x: typeof x === "number" ? x : parseInt(x) || 0,
      y: typeof y === "number" ? y : parseInt(y) || 0
    })
  }, [x, y])

  useEffect(() => {
    if (showExtractPagesChecked) {
      setShowExtractPages(direction)
    } else {
      setShowExtractPages(undefined)
    }
    if (showMoveDocumentChecked) {
      setShowMoveDocument(direction)
    } else {
      setShowMoveDocument(undefined)
    }
  }, [direction, showMoveDocumentChecked, showExtractPagesChecked])

  return (
    <Stack>
      <Group>
        <Button onClick={() => setOpened(!opened)}>Toggle Visibility</Button>
        <Select
          label="Arrow Direction"
          placeholder="Pick a value"
          data={["left", "right"]}
          onChange={onDirectionChange}
        />
        <Stack>
          <Checkbox
            label={"Show Rotate CC/CW Items"}
            checked={showRotate}
            onChange={event => setShowRotate(event.currentTarget.checked)}
          />
          <Checkbox
            label={"Show ViewOCRText Item"}
            checked={showViewOCRText}
            onChange={event => setShowViewOCRText(event.currentTarget.checked)}
          />
          <Checkbox
            label={"Show MoveDocument Item"}
            checked={showMoveDocumentChecked}
            onChange={event =>
              setShowMoveDocumentChecked(event.currentTarget.checked)
            }
          />
          <Checkbox
            label={"Show ExtractPages Item"}
            checked={showExtractPagesChecked}
            onChange={event =>
              setShowExtractPagesChecked(event.currentTarget.checked)
            }
          />
          <Checkbox
            label={"Show Delete Pages Item"}
            checked={showDeletePages}
            onChange={event => setShowDeletePages(event.currentTarget.checked)}
          />
          <Checkbox
            label={"Show Delete Document Item"}
            checked={showDeleteDocument}
            onChange={event =>
              setShowDeleteDocument(event.currentTarget.checked)
            }
          />
          <Checkbox
            label={"Show Reset Changes Item"}
            checked={showResetChanges}
            onChange={event => setShowResetChanges(event.currentTarget.checked)}
          />
          <Checkbox
            label={"Show SaveChanges Item"}
            checked={showSaveChanges}
            onChange={event => setShowSaveChanges(event.currentTarget.checked)}
          />
        </Stack>
        <Stack>
          <NumberInput
            step={STEP}
            min={MIN}
            max={MAX}
            defaultValue={INITIAL_POS_X}
            value={x}
            onChange={setX}
          />
          <NumberInput
            step={STEP}
            min={MIN}
            max={MAX}
            defaultValue={INITIAL_POS_Y}
            value={y}
            onChange={setY}
          />
        </Stack>
      </Group>
      <ContextMenu
        position={pos}
        opened={opened}
        showRotateCCItem={showRotate}
        showRotateCWItem={showRotate}
        showViewOCRedTextItem={showViewOCRText}
        showMoveDocumentItem={showMoveDocument}
        showExtractPagesItem={showExtractPages}
        showDeletePagesItem={showDeletePages}
        showDeleteDocumentItem={showDeleteDocument}
        showResetChangesItem={showResetChanges}
        showSaveChangesItem={showSaveChanges}
      />
    </Stack>
  )
}
