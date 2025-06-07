import {
  ColorSchemeScript,
  createTheme,
  mantineHtmlProps,
  MantineProvider
} from "@mantine/core"
import "@mantine/core/styles.css"

export const theme = createTheme({})

export const metadata = {
  title: "Mantine Next.js template",
  description: "I am using Mantine with Next.js!"
}

export default function RootLayout({children}: {children: any}) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </body>
    </html>
  )
}
