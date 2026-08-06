import { Form, showToast, Toast, closeMainWindow, showHUD } from "@raycast/api";
import type * as z from "zod/mini";

/** Adapt literal-typed useForm fields to Form.Dropdown's string onChange. */
export const dropdownProps = <T extends string>(
  props: Partial<Form.ItemProps<T>> & { id: string },
): Partial<Form.ItemProps<string>> & { id: string } => props as Partial<Form.ItemProps<string>> & { id: string };

type AnimatedToastOptions = {
  successTitle?: string;
  successMessage?: string;
  failureTitle?: string;
  finally?: () => void;
};

/** Run async work under an animated toast. Failures are shown in the toast and not rethrown. */
export const withAnimatedToast = async (
  title: string,
  work: () => Promise<void>,
  { successTitle = "Done", successMessage, failureTitle = "Failed", finally: onFinally }: AnimatedToastOptions = {},
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
  } finally {
    onFinally?.();
  }
};

/**
 * Close Raycast immediately, then run work. Success → HUD; failure → toast
 * (Raycast may reopen for the toast).
 */
export const withClosedWindow = async (
  successHud: string,
  work: () => Promise<void>,
  { failureTitle = "Failed" }: { failureTitle?: string } = {},
) => {
  await closeMainWindow({ clearRootSearch: true });
  try {
    await work();
    await showHUD(successHud);
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: failureTitle,
      message: error instanceof Error ? error.message : String(error),
    });
  }
};

type SafeParseable = {
  safeParse: (data: unknown) => { success: true } | { success: false; error: z.core.$ZodError };
};

/** useForm field validator backed by a Zod schema (single contract with submit parsing). */
export const zodField =
  (schema: SafeParseable) =>
  (value: unknown): string | undefined => {
    const result = schema.safeParse(value);
    if (result.success) return undefined;
    return result.error.issues[0]?.message ?? "Invalid input";
  };
