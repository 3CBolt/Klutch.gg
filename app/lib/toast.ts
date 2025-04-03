import { toast } from "sonner";

interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const showToast = {
  success: (title: string, options?: ToastOptions) => {
    toast.success(title, {
      description: options?.description,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    });
  },

  error: (error: Error | string, options?: ToastOptions) => {
    const title = error instanceof Error ? error.message : error;
    toast.error(title, {
      description: options?.description,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    });
  },

  warning: (title: string, options?: ToastOptions) => {
    toast.warning(title, {
      description: options?.description,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    });
  },

  info: (title: string, options?: ToastOptions) => {
    toast.info(title, {
      description: options?.description,
      action: options?.action && {
        label: options.action.label,
        onClick: options.action.onClick,
      },
    });
  },

  promise: async <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string;
      error: string;
    },
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};
