import { Action, ActionPanel, Alert, confirmAlert, Form, Icon, popToRoot, showToast, Toast } from "@raycast/api";
import { useForm } from "@raycast/utils";
import { readFile } from "fs/promises";

import * as utils from "./lib/utils";
import { applySettingsExport, parseSettingsExport } from "./settings/transfer";

type ImportFormValues = {
  file: string[];
};

export default function Command() {
  const { handleSubmit, itemProps } = useForm<ImportFormValues>({
    validation: {
      file: (value) => {
        if (!value?.[0]) return "Choose a settings JSON file";
      },
    },
    onSubmit: async (values) => {
      const filePath = values.file[0];
      let payload;
      try {
        payload = parseSettingsExport(await readFile(filePath, "utf8"));
      } catch (error) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Invalid settings file",
          message: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      const confirmed = await confirmAlert({
        title: "Replace local settings?",
        message: "This overwrites org display prefs and pins. The project scan catalog is left alone.",
        icon: Icon.Download,
        primaryAction: { title: "Import", style: Alert.ActionStyle.Destructive },
      });
      if (!confirmed) return;

      await utils.withAnimatedToast(
        "Importing settings…",
        async () => {
          await applySettingsExport(payload);
          await popToRoot();
        },
        { successTitle: "Settings imported", failureTitle: "Import failed" },
      );
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Import Settings" icon={Icon.Download} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Import a Salesforce Pilot settings JSON export. Existing org prefs and pins will be replaced." />
      <Form.FilePicker
        title="Settings File"
        allowMultipleSelection={false}
        canChooseDirectories={false}
        info="JSON created by Export Settings"
        {...itemProps.file}
      />
    </Form>
  );
}
