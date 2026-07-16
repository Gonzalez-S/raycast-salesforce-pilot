import { Form, showToast, Toast } from "@raycast/api";

/** Adapt literal-typed useForm fields to Form.Dropdown's string onChange. */
export const dropdownProps = <T extends string>(
  props: Partial<Form.ItemProps<T>> & { id: string },
): Partial<Form.ItemProps<string>> & { id: string } => props as Partial<Form.ItemProps<string>> & { id: string };

type AnimatedToastOptions = {
  successTitle?: string;
  successMessage?: string;
  failureTitle?: string;
};

export const withAnimatedToast = async (
  title: string,
  work: () => Promise<void>,
  { successTitle = "Done", successMessage, failureTitle = "Failed" }: AnimatedToastOptions = {},
) => {
  const toast = await showToast({ style: Toast.Style.Animated, title });
  try {
    await work();
    toast.style = Toast.Style.Success;
    toast.title = successTitle;
    toast.message = successMessage;
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = failureTitle;
    toast.message = error instanceof Error ? error.message : String(error);
  }
};
