import {CategoryToken} from "@/features/search/microcomp/types"
import {Box, Group, MultiSelect, Select, Text} from "@mantine/core"

interface Args {
  item: CategoryToken
}

export default function SearchTokenCategoryComponent({item}: Args) {
  return (
    <Box
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
        borderRadius: "0.5rem",
        padding: "2px 8px",
        border: "1px solid #d0d0d0",
        cursor: "pointer",
        transition: "all 0.2s ease"
      }}
      onClick={e => e.stopPropagation()}
    >
      <Group gap={0}>
        <Text c={"blue"}>cat:</Text>
        <TokenCategoryOperator item={item} />
        <TokenCategoryValues item={item} />
      </Group>
    </Box>
  )
}

function TokenCategoryOperator({item}: Args) {
  return (
    <Select
      value={`${item.operator}:`}
      w={"8ch"}
      data={["any:", "not:"]}
      size="sm"
      onClick={e => e.stopPropagation()}
      styles={{
        input: {
          minHeight: "auto",
          paddingRight: 4,
          paddingLeft: 4,
          border: "none",
          backgroundColor: "transparent",
          fontSize: "14px",
          cursor: "pointer",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.05)"
          }
        },
        wrapper: {
          marginBottom: 0
        }
      }}
    />
  )
}

function TokenCategoryValues({item}: Args) {
  return <MultiSelect data={item.values} onClick={e => e.stopPropagation()} />
}
