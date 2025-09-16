import {MantineStyleProp, Table, Text} from "@mantine/core"

interface EmptyRowArgs {
  message: string
  style?: MantineStyleProp
}

export default function EmptyTableBody({style = {}, message}: EmptyRowArgs) {
  return (
    <Table.Tbody style={style}>
      <Table.Tr>
        <Table.Td
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "3rem",
            width: "100%"
          }}
        >
          <Text c="dimmed">{message}</Text>
        </Table.Td>
      </Table.Tr>
    </Table.Tbody>
  )
}
