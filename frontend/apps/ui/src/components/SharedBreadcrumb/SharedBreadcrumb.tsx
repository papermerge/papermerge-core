import {SHARED_FOLDER_ROOT_ID} from "@/cconstants"
import type {NType} from "@/types"
import {Anchor, Breadcrumbs, Group, Loader, Skeleton} from "@mantine/core"
import {IconUserShare} from "@tabler/icons-react"
import {useRef} from "react"
import {useTranslation} from "react-i18next"
import classes from "./Breadcrumbs.module.css"

interface Args {
  onClick: (node: NType) => void
  className?: string
  breadcrumb?: Array<[string, string]>
  isFetching?: boolean
}

export default function SharedBreadcrumb({
  breadcrumb,
  className,
  isFetching,
  onClick
}: Args) {
  const {t} = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  if (!breadcrumb) {
    return (
      <Skeleton ref={ref} width={"25%"} my="md">
        <Breadcrumbs>{["one", "two"]}</Breadcrumbs>
      </Skeleton>
    )
  }

  if (breadcrumb.length == 1 && breadcrumb[0][0] == SHARED_FOLDER_ROOT_ID) {
    return (
      <Breadcrumbs className={classes.breadcrumbs}>
        <Anchor
          onClick={() => onClick({id: SHARED_FOLDER_ROOT_ID, ctype: "folder"})}
        >
          <Group>
            <IconUserShare /> {t("shared.name")}
          </Group>
        </Anchor>
      </Breadcrumbs>
    )
  }

  const items = breadcrumb

  const links = items.slice(0, -1).map(i => (
    <Anchor key={i[0]} onClick={() => onClick({id: i[0], ctype: "folder"})}>
      {i[1]}
    </Anchor>
  ))
  const lastOne = items[items.length - 1][1]

  return (
    <Group ref={ref} my={0} className={className}>
      <Breadcrumbs className={classes.breadcrumbs}>
        <Anchor
          onClick={() => onClick({id: SHARED_FOLDER_ROOT_ID, ctype: "folder"})}
        >
          <Group>
            <IconUserShare /> {t("shared.name")}
          </Group>
        </Anchor>
        {links}
        <Anchor>{lastOne}</Anchor>
      </Breadcrumbs>
      {isFetching && <Loader size={"sm"} />}
    </Group>
  )
}
