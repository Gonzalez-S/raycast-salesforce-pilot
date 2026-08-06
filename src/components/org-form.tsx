import { Action, ActionPanel, Form, Icon, showToast, Toast, useNavigation } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { useState } from "react";
import type * as z from "zod/mini";

import * as utils from "../lib/utils";
import {
  DEFAULT_GROUP,
  DEFAULT_PRODUCTION_COLOR,
  DEFAULT_SANDBOX_COLOR,
  PRODUCTION_COLORS,
  SANDBOX_COLORS,
} from "../org/constants";
import { title as orgTitle } from "../org/presentation";
import * as orgs from "../org/service";
import {
  addOrgFormValuesSchema,
  colorValueSchema,
  loginHostSchema,
  type Org,
  type OrgDisplaySettings,
  orgDisplaySettingsSchema,
  requiredStringSchema,
} from "../org/schemas";

const productionColorItems = PRODUCTION_COLORS.map((color) => (
  <Form.Dropdown.Item
    key={color.value}
    value={color.value}
    title={color.name}
    icon={{ source: Icon.CircleFilled, tintColor: color.value }}
  />
));

const sandboxColorItems = SANDBOX_COLORS.map((color) => (
  <Form.Dropdown.Item
    key={color.value}
    value={color.value}
    title={color.name}
    icon={{ source: Icon.CircleFilled, tintColor: color.value }}
  />
));

const ColorDropdown = (props: Partial<Form.ItemProps<string>> & { id: string }) => (
  <Form.Dropdown title="Color" {...props}>
    <Form.Dropdown.Section title="Production / Dev Hub">{productionColorItems}</Form.Dropdown.Section>
    <Form.Dropdown.Section title="Sandbox & Scratch">{sandboxColorItems}</Form.Dropdown.Section>
  </Form.Dropdown>
);

const GroupField = ({
  groupProps,
  knownGroups,
}: {
  groupProps: Partial<Form.ItemProps<string>> & { id: string };
  knownGroups: string[];
}) => (
  <>
    <Form.TextField
      title="Group"
      placeholder={DEFAULT_GROUP}
      info="Manual list bucket (e.g. US, UK). Favorites are separate pins and stay on top of every group scope."
      {...groupProps}
    />
    {knownGroups.length > 0 ? <Form.Description text={`Existing groups: ${knownGroups.join(", ")}`} /> : null}
  </>
);

export const AddOrgForm = ({ knownGroups, onDone }: { knownGroups: string[]; onDone: () => void }) => {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, itemProps, setValue, values } = useForm<z.input<typeof addOrgFormValuesSchema>>({
    initialValues: {
      loginHost: "sandbox",
      alias: "",
      label: "",
      color: DEFAULT_SANDBOX_COLOR,
      group: DEFAULT_GROUP,
    },
    validation: {
      loginHost: utils.zodField(loginHostSchema),
      alias: utils.zodField(requiredStringSchema),
      color: utils.zodField(colorValueSchema),
      group: utils.zodField(requiredStringSchema),
    },
    onSubmit: async (formValues) => {
      const parsed = addOrgFormValuesSchema.parse(formValues);
      setIsLoading(true);
      await utils.withAnimatedToast(
        "Waiting for Salesforce login…",
        async () => {
          await orgs.authenticate(parsed.alias, parsed.loginHost, {
            label: parsed.label,
            color: parsed.color,
            group: parsed.group,
          });
          onDone();
          pop();
        },
        {
          successTitle: "Org authenticated",
          successMessage: parsed.alias,
          failureTitle: "Authentication failed",
          finally: () => setIsLoading(false),
        },
      );
    },
  });

  const loginHostProps = utils.dropdownProps(itemProps.loginHost);

  return (
    <Form
      isLoading={isLoading}
      navigationTitle="Add Salesforce Org"
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Authenticate" icon={Icon.Key} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Salesforce opens a browser for OAuth. The org is saved to the SF CLI keystore. Assign a group so it shows up in the right list scope." />
      <Form.Dropdown
        title="Login Host"
        {...loginHostProps}
        onChange={(value) => {
          loginHostProps.onChange?.(value);
          const nextDefault = value === "production" ? DEFAULT_PRODUCTION_COLOR : DEFAULT_SANDBOX_COLOR;
          const inProduction = PRODUCTION_COLORS.some((c) => c.value === values.color);
          const inSandbox = SANDBOX_COLORS.some((c) => c.value === values.color);
          if (value === "production" && !inProduction) setValue("color", nextDefault);
          if (value === "sandbox" && !inSandbox) setValue("color", nextDefault);
        }}
      >
        <Form.Dropdown.Item value="production" title="Production / Dev Hub" />
        <Form.Dropdown.Item value="sandbox" title="Sandbox" />
      </Form.Dropdown>
      <Form.TextField title="Alias" placeholder="us-dev1" {...itemProps.alias} />
      <Form.Separator />
      <Form.TextField title="Label" placeholder="Optional display name" {...itemProps.label} />
      <ColorDropdown {...utils.dropdownProps(itemProps.color)} />
      <GroupField groupProps={itemProps.group} knownGroups={knownGroups} />
    </Form>
  );
};

export const EditOrgForm = ({
  org,
  knownGroups,
  onSave,
}: {
  org: Org;
  knownGroups: string[];
  onSave: (settings: OrgDisplaySettings) => Promise<void>;
}) => {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, itemProps } = useForm<z.input<typeof orgDisplaySettingsSchema>>({
    initialValues: {
      label: org.label ?? "",
      color: org.color,
      group: org.group,
    },
    validation: {
      color: utils.zodField(colorValueSchema),
      group: utils.zodField(requiredStringSchema),
    },
    onSubmit: async (formValues) => {
      const displaySettings = orgDisplaySettingsSchema.parse(formValues);
      setIsLoading(true);
      try {
        await onSave(displaySettings);
        pop();
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to save",
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <Form
      isLoading={isLoading}
      navigationTitle={`Edit ${orgTitle(org)}`}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save" icon={Icon.Check} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description title="Alias" text={org.alias} />
      <Form.Description title="Username" text={org.username} />
      <Form.Description title="Instance URL" text={org.instanceUrl || "—"} />
      <Form.Separator />
      <Form.TextField title="Label" placeholder="Optional display name" {...itemProps.label} />
      <ColorDropdown {...utils.dropdownProps(itemProps.color)} />
      <GroupField groupProps={itemProps.group} knownGroups={knownGroups} />
    </Form>
  );
};
