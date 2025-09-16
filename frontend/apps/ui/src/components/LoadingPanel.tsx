import {Loader, Paper} from "@mantine/core"

export default function LoadingPanel() {
  return (
    <Paper
      p="md"
      withBorder
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Loader />
    </Paper>
  )
}
