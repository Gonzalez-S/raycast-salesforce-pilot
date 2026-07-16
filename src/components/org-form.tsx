import { Action, ActionPanel, Form, Icon, useNavigation } from "@raycast/api";
import { FormValidation, useForm } from "@raycast/utils";
import { useState } from "react";
import type * as z from "zod/mini";

import { COLORS, DEFAULT_COLOR, DEFAULT_SECTION } from "../shared/constants";
import * as orgs from "../shared/orgs";
import { addOrgFormValuesSchema, type Org, type OrgDisplaySettings, orgDisplaySettingsSchema } from "../shared/schemas";
import * as utils from "../shared/utils";

const colorItems = COLORS.map((color) => (
  <Form.Dropdown.Item
    key={color.value}
    value={color.value}
    title={color.name}
    icon={{ source: Icon.CircleFilled, tintColor: color.value }}
  />
));

export const AddOrgForm = ({ onDone }: { onDone: () => void }) => {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, itemProps } = useForm<z.input<typeof addOrgFormValuesSchema>>({
    initialValues: {
      loginHost: "sandbox",
      alias: "",
      label: "",
      color: DEFAULT_COLOR,
      section: DEFAULT_SECTION,
    },
    validation: {
      loginHost: FormValidation.Required,
      alias: FormValidation.Required,
      color: FormValidation.Required,
      section: FormValidation.Required,
    },
    onSubmit: async (values) => {
      const parsed = addOrgFormValuesSchema.parse(values);
      setIsLoading(true);
      await utils.withAnimatedToast(
        "Waiting for Salesforce login…",
        async () => {
          await orgs.authenticate(parsed.alias, parsed.loginHost, {
            label: parsed.label,
            color: parsed.color,
            section: parsed.section,
          });
          onDone();
          pop();
        },
        {
          successTitle: "Org authenticated",
          successMessage: parsed.alias,
          failureTitle: "Authentication failed",
        },
      );
      setIsLoading(false);
    },
  });

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
      <Form.Description text="Salesforce opens a browser for OAuth. The org is saved to the SF CLI keystore." />
      <Form.Dropdown title="Login Host" {...utils.dropdownProps(itemProps.loginHost)}>
        <Form.Dropdown.Item value="production" title="Production / Dev Hub" />
        <Form.Dropdown.Item value="sandbox" title="Sandbox" />
      </Form.Dropdown>
      <Form.TextField title="Alias" placeholder="my-scratch" {...itemProps.alias} />
      <Form.Separator />
      <Form.TextField title="Label" placeholder="Optional display name" {...itemProps.label} />
      <Form.Dropdown title="Color" {...utils.dropdownProps(itemProps.color)}>
        {colorItems}
      </Form.Dropdown>
      <Form.TextField title="Section" placeholder={DEFAULT_SECTION} {...itemProps.section} />
    </Form>
  );
};

export const EditOrgForm = ({ org, onSave }: { org: Org; onSave: (settings: OrgDisplaySettings) => Promise<void> }) => {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const { handleSubmit, itemProps } = useForm<z.input<typeof orgDisplaySettingsSchema>>({
    initialValues: {
      label: org.label ?? "",
      color: org.color,
      section: org.section,
    },
    validation: {
      color: FormValidation.Required,
      section: FormValidation.Required,
    },
    onSubmit: async (values) => {
      const settings = orgDisplaySettingsSchema.parse(values);
      setIsLoading(true);
      await utils.withAnimatedToast(
        "Saving…",
        async () => {
          await onSave(settings);
          pop();
        },
        { successTitle: "Saved", failureTitle: "Failed to save" },
      );
      setIsLoading(false);
    },
  });

  return (
    <Form
      isLoading={isLoading}
      navigationTitle={`Edit ${orgs.title(org)}`}
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
      <Form.Dropdown title="Color" {...utils.dropdownProps(itemProps.color)}>
        {colorItems}
      </Form.Dropdown>
      <Form.TextField title="Section" placeholder={DEFAULT_SECTION} {...itemProps.section} />
    </Form>
  );
};
