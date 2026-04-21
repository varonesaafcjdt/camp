'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      closeButton
      expand={false}
      visibleToasts={1}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-[#686d76] group-[.toaster]:text-white group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-slate-200',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
