import {Container, Paper} from "@mantine/core"
import {TokenList} from "@/features/api-tokens/components"

export default function APITokensPage() {
  return (
    <Container size="xl" py="md">
      <Paper shadow="xs" p="md" withBorder>
        <TokenList />
      </Paper>
    </Container>
  )
}
