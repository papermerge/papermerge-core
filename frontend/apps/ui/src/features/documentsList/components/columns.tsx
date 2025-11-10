import ErrorBoundary from "@/app/ErrorBoundary"
import DateFMT from "@/components/DateFMT"
import {MonetaryFMT, NumberFMT} from "@/components/NumberFMT"
import Tags from "@/components/Tags"
import TimestampZ from "@/components/Timestampz"
import TruncatedTextWithCopy from "@/components/TruncatedTextWithCopy"
import type {Category, DocumentListItem} from "@/features/documentsList/types"
import type {ByUser} from "@/types"
import {Box, Text} from "@mantine/core"
import {TFunction} from "i18next"
import type {ColumnConfig} from "kommon"

interface Args {
  items?: DocumentListItem[]
  t?: TFunction
}

export default function documentByCategoryColumns({items, t}: Args) {
  const firstColumns: ColumnConfig<DocumentListItem>[] = [
    {
      key: "title",
      label:
        t?.("documentsByCategory.title", {defaultValue: "Title"}) || "Title",
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 150,
      render: (value, row, onClick) => {
        return (
          <Box
            style={{cursor: "pointer"}}
            onClick={() => onClick?.(row, false)}
          >
            <Text component="a">{value as string}</Text>
          </Box>
        )
      }
    },
    {
      key: "id",
      label: t?.("documentsByCategory.id", {defaultValue: "ID"}) || "ID",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TruncatedTextWithCopy value={value as string} />
    },
    {
      key: "category",
      label:
        t?.("documentsByCategory.category", {defaultValue: "Category"}) ||
        "Category",
      sortable: true,
      filterable: true,
      width: 200,
      minWidth: 150,
      render: value => (
        <Text size="sm">{value && (value as Category).name}</Text>
      )
    },
    {
      key: "tags",
      label: t?.("documentsByCategory.tags", {defaultValue: "Tags"}) || "Tags",
      sortable: false,
      filterable: true,
      width: 200,
      minWidth: 150,
      render: value => <Tags items={value as TagType[]} />
    }
  ]

  const lastColumns: ColumnConfig<DocumentListItem>[] = [
    {
      key: "created_at",
      label:
        t?.("documentsByCategory.created_at", {defaultValue: "Created At"}) ||
        "Created At",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "created_by",
      label:
        t?.("documentsByCategory.created_by", {defaultValue: "Created By"}) ||
        "Created By",
      sortable: true,
      filterable: true,
      visible: true,
      width: 200,
      minWidth: 100,
      render: value => (
        <Text size="sm">{value && (value as ByUser).username}</Text>
      )
    },
    {
      key: "updated_at",
      label:
        t?.("documentsByCategory.updated_at", {defaultValue: "Updated At"}) ||
        "Updated At",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <TimestampZ value={value as string} />
    },
    {
      key: "updated_by",
      label:
        t?.("documentsByCategory.updated_by", {defaultValue: "Updated By"}) ||
        "updated By",
      sortable: true,
      filterable: true,
      visible: false,
      width: 200,
      minWidth: 100,
      render: value => <Text size="sm">{(value as ByUser).username}</Text>
    }
  ]

  let customFieldsColumns: ColumnConfig<DocumentListItem>[] = []

  if (items && items?.length > 0) {
    items[0].custom_fields.forEach(customFieldColumn => {
      const func = (_: any, row: DocumentListItem) => {
        const rowCF = row.custom_fields.find(
          rcf => rcf.custom_field.name == customFieldColumn.custom_field.name
        )
        const rowCFValue = rowCF?.custom_field_value?.value?.raw

        if (rowCFValue) {
          if (customFieldColumn.custom_field.type_handler == "date") {
            return (
              <ErrorBoundary fallback={<Text c="red">{rowCFValue}</Text>}>
                <DateFMT value={rowCFValue} />
              </ErrorBoundary>
            )
          }
          if (customFieldColumn.custom_field.type_handler == "monetary") {
            return <MonetaryFMT value={rowCFValue} />
          }
          if (
            ["integer", "number"].includes(
              customFieldColumn.custom_field.type_handler
            )
          ) {
            return (
              <ErrorBoundary fallback={<Text c="red">{rowCFValue}</Text>}>
                <NumberFMT value={rowCFValue} />
              </ErrorBoundary>
            )
          }

          return <Text size="sm">{rowCFValue}</Text>
        }

        return <></>
      }

      const column = {
        key: customFieldColumn.custom_field.name,
        label: customFieldColumn.custom_field.name,
        sortable: true,
        filterable: false,
        visible: true,
        width: 200,
        minWidth: 100,
        render: func
      }
      // @ts-ignore
      customFieldsColumns.push(column)
    })
  }

  return [...firstColumns, ...customFieldsColumns, ...lastColumns]
}
