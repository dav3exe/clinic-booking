"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Toaster } from "sonner";
import { useTheme } from "@/hooks/use-theme";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1 } } }));
  const { theme } = useTheme();
  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors theme={theme} position="top-center" />
    </QueryClientProvider>
  );
}
