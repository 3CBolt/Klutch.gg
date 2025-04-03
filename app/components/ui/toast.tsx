import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
        classNames: {
          toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          title: 'text-sm font-semibold',
          description: 'text-sm opacity-90',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          error: 'group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground',
          success: 'group-[.toaster]:bg-green-50 group-[.toaster]:border-green-200 group-[.toaster]:text-green-800',
          warning: 'group-[.toaster]:bg-yellow-50 group-[.toaster]:border-yellow-200 group-[.toaster]:text-yellow-800',
          info: 'group-[.toaster]:bg-blue-50 group-[.toaster]:border-blue-200 group-[.toaster]:text-blue-800',
        },
      }}
    />
  );
} 