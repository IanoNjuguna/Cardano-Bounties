"use client";

import dynamic from "next/dynamic";
import { WalletProvider } from "@/components/wallet/WalletProvider";

const MeshProvider = dynamic(
  () => import("@meshsdk/react").then((mod) => mod.MeshProvider),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MeshProvider>
      <WalletProvider>{children}</WalletProvider>
    </MeshProvider>
  );
}

