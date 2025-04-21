import CopyButton from "@/components/CopyButton"
import {Checkbox, Table, TextInput, Tooltip} from "@mantine/core"

import {NODE_VIEW, PAGE_VIEW, ROLE_SELECT} from "@/scopes"
import type {RoleDetails} from "@/types"
import {useTranslation} from "react-i18next"

import {
  CUSTOM_FIELD_CREATE,
  CUSTOM_FIELD_DELETE,
  CUSTOM_FIELD_UPDATE,
  CUSTOM_FIELD_VIEW,
  DOCUMENT_DOWNLOAD,
  DOCUMENT_TYPE_CREATE,
  DOCUMENT_TYPE_DELETE,
  DOCUMENT_TYPE_UPDATE,
  DOCUMENT_TYPE_VIEW,
  DOCUMENT_UPLOAD,
  GROUP_CREATE,
  GROUP_DELETE,
  GROUP_SELECT,
  GROUP_UPDATE,
  NODE_CREATE,
  NODE_DELETE,
  NODE_MOVE,
  NODE_UPDATE,
  PAGE_DELETE,
  PAGE_EXTRACT,
  PAGE_MOVE,
  PAGE_UPDATE,
  ROLE_CREATE,
  ROLE_DELETE,
  ROLE_UPDATE,
  ROLE_VIEW,
  SHARED_NODE_CREATE,
  SHARED_NODE_DELETE,
  SHARED_NODE_UPDATE,
  SHARED_NODE_VIEW,
  TAG_CREATE,
  TAG_DELETE,
  TAG_UPDATE,
  TAG_VIEW,
  TASK_OCR,
  USER_CREATE,
  USER_DELETE,
  USER_ME,
  USER_SELECT,
  USER_UPDATE,
  USER_VIEW
} from "@/scopes"

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
              label={t("roles.form.permissions.actions.select_users.tooltip")}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], USER_SELECT)}
                  label={t("roles.form.permissions.actions.select.label")}
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
                  checked={hasPerm(role?.scopes || [], GROUP_SELECT)}
                  label={t("roles.form.permissions.actions.view")}
                />
              </Table.Td>
            </Tooltip>
            <Tooltip
              label={t("roles.form.permissions.actions.select_groups.tooltip")}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], GROUP_SELECT)}
                  label={t("roles.form.permissions.actions.select.label")}
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
            <Tooltip
              label={t("roles.form.permissions.actions.select_roles.tooltip")}
              multiline
              w={300}
              openDelay={2000}
              withArrow
            >
              <Table.Td>
                <Checkbox
                  readOnly={role == null}
                  onChange={() => {}}
                  checked={hasPerm(role?.scopes || [], ROLE_SELECT)}
                  label={t("roles.form.permissions.actions.select.label")}
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
          <Table.Tr key="shared_nodes">
            <Table.Td>
              {t("roles.form.permissions.groups.shared_nodes")}
            </Table.Td>

            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], SHARED_NODE_VIEW)}
                label="View"
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], SHARED_NODE_CREATE)}
                label={t("roles.form.permissions.actions.create")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], SHARED_NODE_UPDATE)}
                label={t("roles.form.permissions.actions.update")}
              />
            </Table.Td>
            <Table.Td>
              <Checkbox
                readOnly={role == null}
                onChange={() => {}}
                checked={hasPerm(role?.scopes || [], SHARED_NODE_DELETE)}
                label={t("roles.form.permissions.actions.delete")}
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
