"use client";

import { useAppWallet } from "@/components/wallet/WalletProvider";
import { AdminOperationsPage } from "./AdminOperationsPage";
import { DashboardPage } from "./DashboardPage";

export function DashboardHomePage() {
  const { role } = useAppWallet();

  if (role === "admin") {
    return <AdminOperationsPage />;
  }

  return <DashboardPage />;
}
