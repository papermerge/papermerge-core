import {Link} from "react-router-dom"
import {useDispatch, useSelector} from "react-redux"
import {Table, Checkbox, Pill} from "@mantine/core"
import {
  selectionAdd,
  selectionRemove,
  selectSelectedIds
} from "@/features/tags/tagsSlice"
import type {ColoredTag} from "@/types"

import Check from "@/components/Check"

type Args = {
  tag: ColoredTag
}

export default function TagRow({tag}: Args) {
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      dispatch(selectionAdd(tag.id))
    } else {
      dispatch(selectionRemove(tag.id))
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox checked={selectedIds.includes(tag.id)} onChange={onChange} />
      </Table.Td>
      <Table.Td>
        <Link to={`/tags/${tag.id}`}>
          <Pill style={{backgroundColor: tag.bg_color, color: tag.fg_color}}>
            {tag.name}
          </Pill>
        </Link>
      </Table.Td>
      <Table.Td>
        <Check check={tag.pinned} />
      </Table.Td>
      <Table.Td>{tag.description}</Table.Td>
      <Table.Td>{tag.id}</Table.Td>
    </Table.Tr>
  )
}
