import { Action, ActionPanel, Form, Icon, useNavigation } from "@raycast/api";
import { useForm } from "@raycast/utils";

import * as utils from "../lib/utils";
import type { Org } from "../org/schemas";
import * as projects from "../project/service";

type AddProjectFormValues = {
  path: string[];
};

type AddProjectFormProps = {
  org: Org;
  onDone: () => void;
};

export const AddProjectForm = ({ org, onDone }: AddProjectFormProps) => {
  const { pop } = useNavigation();

  const { handleSubmit, itemProps } = useForm<AddProjectFormValues>({
    onSubmit: async (values) => {
      const selectedPath = values.path?.[0];
      if (!selectedPath) {
        throw new Error("Select a folder or workspace file");
      }

      await utils.withAnimatedToast("Adding project…", async () => {
        await projects.addManualProject(org, selectedPath);
        onDone();
        pop();
      });
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Project" icon={Icon.Plus} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Attach a local Salesforce DX folder or editor workspace. Manual projects can be removed later." />
      <Form.FilePicker
        id="path"
        title="Project"
        allowMultipleSelection={false}
        canChooseDirectories
        canChooseFiles
        {...itemProps.path}
      />
    </Form>
  );
};
