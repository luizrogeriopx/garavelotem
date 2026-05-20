import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-brand group-[.toaster]:text-brand-foreground group-[.toaster]:border-white/10 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:font-sans group-[.toaster]:px-5 group-[.toaster]:py-4",
          description: "group-[.toast]:text-white/70 group-[.toast]:text-xs",
          actionButton: "group-[.toast]:bg-highlight group-[.toast]:text-highlight-foreground group-[.toast]:rounded-full group-[.toast]:font-bold",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white group-[.toast]:rounded-full",
          success: "group-[.toaster]:!bg-emerald-600 group-[.toaster]:!text-white group-[.toaster]:!border-emerald-500",
          error: "group-[.toaster]:!bg-rose-600 group-[.toaster]:!text-white group-[.toaster]:!border-rose-500",
          info: "group-[.toaster]:!bg-brand group-[.toaster]:!text-white group-[.toaster]:!border-white/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

