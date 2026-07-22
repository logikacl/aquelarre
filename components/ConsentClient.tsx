"use client";

import ConsentProvider from "@/consent/react/ConsentProvider";

export default function ConsentClient({ children }: { children: React.ReactNode }) {
  return <ConsentProvider>{children}</ConsentProvider>;
}
