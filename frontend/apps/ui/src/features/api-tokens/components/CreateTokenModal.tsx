import {
  Alert,
  Button,
  Code,
  CopyButton,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  TextInput,
  Tooltip
} from "@mantine/core"
import {useForm} from "@mantine/form"
import {IconCheck, IconCopy, IconKey} from "@tabler/icons-react"
import {useState} from "react"
import {useTranslation} from "react-i18next"

import {useCreateAPITokenMutation} from "@/features/api-tokens/apiSlice"
import type {APITokenCreated} from "@/features/api-tokens/types"

interface Props {
  opened: boolean
  onClose: () => void
}

export default function CreateTokenModal({opened, onClose}: Props) {
  const {t} = useTranslation()
  const [createToken, {isLoading}] = useCreateAPITokenMutation()
  const [createdToken, setCreatedToken] = useState<APITokenCreated | null>(null)

  const form = useForm({
    initialValues: {
      name: "",
      expires_in_days: 90 as number | undefined
    },
    validate: {
      name: value =>
        value.trim().length === 0
          ? t("api_tokens.name_required", {defaultValue: "Name is required"})
          : null
    }
  })

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const result = await createToken({
        name: values.name,
        expires_in_days: values.expires_in_days || undefined
      }).unwrap()
      setCreatedToken(result)
      form.reset()
    } catch (err) {
      console.error("Failed to create token:", err)
    }
  }

  const handleClose = () => {
    setCreatedToken(null)
    form.reset()
    onClose()
  }

  // Show the created token
  if (createdToken) {
    return (
      <Modal
        opened={opened}
        onClose={handleClose}
        title={
          <Group gap="xs">
            <IconKey size={20} />
            {t("api_tokens.token_created", {defaultValue: "Token Created"})}
          </Group>
        }
        size="lg"
      >
        <Stack>
          <Alert color="yellow" variant="light">
            <Text size="sm" fw={500}>
              {t("api_tokens.save_warning", {
                defaultValue:
                  "Make sure to copy your token now. You won't be able to see it again!"
              })}
            </Text>
          </Alert>

          <div>
            <Text size="sm" fw={500} mb={4}>
              {t("api_tokens.your_token", {defaultValue: "Your new token"})}:{" "}
              {createdToken.name}
            </Text>
            <Group gap="xs">
              <Code
                block
                style={{
                  flex: 1,
                  fontSize: "0.9rem",
                  wordBreak: "break-all"
                }}
              >
                {createdToken.token}
              </Code>
              <CopyButton value={createdToken.token}>
                {({copied, copy}) => (
                  <Tooltip
                    label={
                      copied
                        ? t("common.copied", {defaultValue: "Copied!"})
                        : t("common.copy", {defaultValue: "Copy"})
                    }
                  >
                    <Button
                      color={copied ? "teal" : "blue"}
                      onClick={copy}
                      size="sm"
                    >
                      {copied ? (
                        <IconCheck size={16} />
                      ) : (
                        <IconCopy size={16} />
                      )}
                    </Button>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </div>

          <Group gap="xs">
            <Text size="sm" mb={4}>
              {t("api_tokens.usage_hint", {
                defaultValue: "Use this token in the Authorization header:"
              })}
            </Text>
            <Code block mt="xs">
              Authorization: Bearer {createdToken.token}
            </Code>

            <CopyButton value={createdToken.token}>
              {({copied, copy}) => (
                <Tooltip
                  label={
                    copied
                      ? t("common.copied", {defaultValue: "Copied!"})
                      : t("common.copy", {defaultValue: "Copy"})
                  }
                >
                  <Button
                    color={copied ? "teal" : "blue"}
                    onClick={copy}
                    size="sm"
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </Button>
                </Tooltip>
              )}
            </CopyButton>
          </Group>

          <Group justify="flex-end">
            <Button onClick={handleClose}>
              {t("common.done", {defaultValue: "Done"})}
            </Button>
          </Group>
        </Stack>
      </Modal>
    )
  }

  // Show the create form
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="xs">
          <IconKey size={20} />
          {t("api_tokens.create", {defaultValue: "Create Token"})}
        </Group>
      }
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput
            label={t("api_tokens.name", {defaultValue: "Name"})}
            placeholder={t("api_tokens.name_placeholder", {
              defaultValue: "e.g., CLI tool, Backup script"
            })}
            required
            {...form.getInputProps("name")}
          />

          <NumberInput
            label={t("api_tokens.expires_in_days", {
              defaultValue: "Expires in (days)"
            })}
            description={t("api_tokens.expires_description", {
              defaultValue: "Leave empty for a token that never expires"
            })}
            min={1}
            max={365}
            placeholder="90"
            {...form.getInputProps("expires_in_days")}
          />

          <Text size="xs" c="dimmed">
            {t("api_tokens.create_hint", {
              defaultValue:
                "The token will have access to all your permissions. You can revoke it at any time."
            })}
          </Text>

          <Group justify="flex-end">
            <Button variant="subtle" onClick={handleClose}>
              {t("common.cancel", {defaultValue: "Cancel"})}
            </Button>
            <Button type="submit" loading={isLoading}>
              {t("api_tokens.create", {defaultValue: "Create Token"})}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
