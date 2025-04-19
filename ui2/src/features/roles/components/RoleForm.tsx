import CopyButton from "@/components/CopyButton"
import {Checkbox, Table, TextInput, Tooltip} from "@mantine/core"

import {NODE_VIEW, PAGE_VIEW} from "@/scopes"
import type {RoleDetails} from "@/types"
import {useTranslation} from "react-i18next"

type Args = {
  role: RoleDetails | null
}

export default function RoleModal({role}: Args) {
  const {t} = useTranslation()
  return (
    <div>
      <TextInput
        value={role?.name || ""}
        onChange={() => {}}
        label="Name"
        rightSection={<CopyButton value={role?.name || ""} />}
      />
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>{t("roles.form.permissions")}</Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr key="document">
            <Table.Td>{t("roles.form.permissions.groups.documents")}</Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], DOCUMENT_UPLOAD)}
                label={t("roles.form.permissions.actions.upload")}
              />
            </Table.Td>

            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], DOCUMENT_DOWNLOAD)}
                label={t("roles.form.permissions.actions.download")}
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="pages">
            <Table.Td>{t("roles.form.permissions.groups.pages")}</Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], PAGE_VIEW)}
                label="View"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], PAGE_MOVE)}
                label={t("roles.form.permissions.actions.move")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], PAGE_UPDATE)}
                label={t("roles.form.permissions.actions.update")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], PAGE_EXTRACT)}
                label={t("roles.form.permissions.actions.extract")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], PAGE_DELETE)}
                label={t("roles.form.permissions.actions.delete")}
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="users">
            <Table.Td>{t("roles.form.permissions.groups.users")}</Table.Td>
            <Tooltip
              label={t("roles.form.permissions.actions.me.tooltip")}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], USER_ME)}
                  label={t("roles.form.permissions.actions.me.label")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label="Grants access to users tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], USER_VIEW)}
                  label={t("roles.form.permissions.actions.view")}
                />
              </Table.Td>
            </Tooltip>

            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], USER_CREATE)}
                label={t("roles.form.permissions.actions.create")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], USER_UPDATE)}
                label={t("roles.form.permissions.actions.update")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], USER_DELETE)}
                label={t("roles.form.permissions.actions.delete")}
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="groups">
            <Table.Td>{t("roles.form.permissions.groups.groups")}</Table.Td>
            <Tooltip
              label="Grants access to groups tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], GROUP_VIEW)}
                  label={t("roles.form.permissions.actions.view")}
                />
              </Table.Td>
            </Tooltip>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], GROUP_CREATE)}
                label={t("roles.form.permissions.actions.create")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], GROUP_UPDATE)}
                label={t("roles.form.permissions.actions.update")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(role?.scopes || [], GROUP_DELETE)}
                onChange={() => {}}
                readOnly={role == null}
                label={t("roles.form.permissions.actions.delete")}
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="role">
            <Table.Td>{t("roles.form.permissions.groups.roles")}</Table.Td>
            <Tooltip
              label="Grants access to roles tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], ROLE_VIEW)}
                  label={t("roles.form.permissions.actions.view")}
                />
              </Table.Td>
            </Tooltip>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], ROLE_CREATE)}
                label={t("roles.form.permissions.actions.create")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], ROLE_UPDATE)}
                label={t("roles.form.permissions.actions.update")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                checked={hasPerm(role?.scopes || [], ROLE_DELETE)}
                onChange={() => {}}
                readOnly={role == null}
                label={t("roles.form.permissions.actions.delete")}
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="tags">
            <Table.Td>{t("roles.form.permissions.groups.tags")}</Table.Td>
            <Tooltip
              label="Grants access to tags tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], TAG_VIEW)}
                  label={t("roles.form.permissions.actions.view")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label="Grants access to create new tags"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], TAG_CREATE)}
                  label={t("roles.form.permissions.actions.create")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label="Grants access to create update tag properties e.g. change tag color"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], TAG_UPDATE)}
                  label={t("roles.form.permissions.actions.update")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label={
                "Grants permissions to delete tags. Note that this is not the same " +
                "as associating tag to nodes."
              }
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], TAG_DELETE)}
                  label={t("roles.form.permissions.actions.delete")}
                />
              </Table.Td>
            </Tooltip>
          </Table.Tr>
          <Table.Tr key="custom-fields">
            <Table.Td>
              {t("roles.form.permissions.groups.custom_fields")}
            </Table.Td>
            <Tooltip
              label="Grants access to custom fields tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], CUSTOM_FIELD_VIEW)}
                  label={t("roles.form.permissions.actions.view")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label="Grants access to create new custom fields"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], CUSTOM_FIELD_CREATE)}
                  label={t("roles.form.permissions.actions.create")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label="Grants access to update custom fields"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], CUSTOM_FIELD_UPDATE)}
                  label={t("roles.form.permissions.actions.update")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label={"Grants permissions to delete custom fields"}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], CUSTOM_FIELD_DELETE)}
                  label={t("roles.form.permissions.actions.delete")}
                />
              </Table.Td>
            </Tooltip>
          </Table.Tr>
          <Table.Tr key="document-types">
            <Table.Td>
              {t("roles.form.permissions.groups.document_types")}
            </Table.Td>
            <Tooltip
              label="Grants access document types tab on left side navigation panel"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], DOCUMENT_TYPE_VIEW)}
                  label={t("roles.form.permissions.actions.view")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label="Grants access to create new document types"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], DOCUMENT_TYPE_CREATE)}
                  label={t("roles.form.permissions.actions.create")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label="Grants access to update document types"
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], DOCUMENT_TYPE_UPDATE)}
                  label={t("roles.form.permissions.actions.update")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label={"Grants permissions to delete document types"}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], DOCUMENT_TYPE_DELETE)}
                  label={t("roles.form.permissions.actions.delete")}
                />
              </Table.Td>
            </Tooltip>
          </Table.Tr>
          <Table.Tr key="nodes">
            <Tooltip
              label={"Nodes here means both documents and folders"}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>{t("roles.form.permissions.groups.nodes")}</Table.Td>
            </Tooltip>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], NODE_VIEW)}
                label="View"
              />
            </Table.Td>
            <Tooltip
              label={"Grants permission to create folders"}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], NODE_CREATE)}
                  label={t("roles.form.permissions.actions.create")}
                />
              </Table.Td>
            </Tooltip>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], NODE_UPDATE)}
                label={t("roles.form.permissions.actions.update")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], NODE_DELETE)}
                label={t("roles.form.permissions.actions.delete")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], NODE_MOVE)}
                label={t("roles.form.permissions.actions.move")}
              />
            </Table.Td>
          </Table.Tr>
          <Table.Tr key="tasks">
            <Table.Td>{t("roles.form.permissions.groups.tasks")}</Table.Td>
            <Tooltip
              label={"Grants permission to manually trigger OCR"}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], TASK_OCR)}
                  label={t("roles.form.permissions.actions.ocr")}
                />
              </Table.Td>
            </Tooltip>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </div>
  )
}

function hasPerm(scopes: string[], perm: string): boolean {
  return scopes.includes(perm)
}

const DOCUMENT_DOWNLOAD = "document.download"
const DOCUMENT_UPLOAD = "document.upload"
const PAGE_MOVE = "page.move"
const PAGE_UPDATE = "page.update"
const PAGE_DELETE = "page.delete"
const PAGE_EXTRACT = "page.extract"
const USER_ME = "user.me"
const USER_VIEW = "user.view"
const USER_CREATE = "user.create"
const USER_UPDATE = "user.update"
const USER_DELETE = "user.delete"
const GROUP_VIEW = "group.view"
const GROUP_CREATE = "group.create"
const GROUP_UPDATE = "group.update"
const GROUP_DELETE = "group.delete"
const ROLE_VIEW = "role.view"
const ROLE_CREATE = "role.create"
const ROLE_UPDATE = "role.update"
const ROLE_DELETE = "role.delete"
const TAG_VIEW = "tag.view"
const TAG_CREATE = "tag.create"
const TAG_UPDATE = "tag.update"
const TAG_DELETE = "tag.delete"
const CUSTOM_FIELD_VIEW = "custom_field.view"
const CUSTOM_FIELD_CREATE = "custom_field.create"
const CUSTOM_FIELD_UPDATE = "custom_field.update"
const CUSTOM_FIELD_DELETE = "custom_field.delete"
const DOCUMENT_TYPE_VIEW = "document_type.view"
const DOCUMENT_TYPE_CREATE = "document_type.create"
const DOCUMENT_TYPE_UPDATE = "document_type.update"
const DOCUMENT_TYPE_DELETE = "document_type.delete"
const NODE_CREATE = "node.create"
const NODE_UPDATE = "node.update"
const NODE_DELETE = "node.delete"
const NODE_MOVE = "node.move"
const TASK_OCR = "task.ocr"
