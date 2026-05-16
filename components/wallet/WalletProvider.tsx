"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { BrowserWallet } from "@meshsdk/core";
import type { Wallet } from "@meshsdk/common";

type WalletContextValue = {
  wallet: BrowserWallet | null;
  wallets: Wallet[];
  walletId: string;
  walletName: string;
  address: string;
  connected: boolean;
  connecting: boolean;
  error: string;
  loadWallets: () => Promise<void>;
  connectWallet: (walletId: string) => Promise<void>;
  disconnectWallet: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);
const STORAGE_KEY = "cardano-bounties-wallet-id";

async function resolveWalletAddress(wallet: BrowserWallet) {
  const usedAddresses = await wallet.getUsedAddresses();
  const changeAddress = await wallet.getChangeAddress();
  return usedAddresses[0] || changeAddress || "";
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletId, setWalletId] = useState("");
  const [walletName, setWalletName] = useState("");
  const [address, setAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  const loadWallets = useCallback(async () => {
    setError("");

    try {
      const { BrowserWallet } = await import("@meshsdk/core");
      setWallets(await BrowserWallet.getAvailableWallets());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to detect wallet extensions.");
    }
  }, []);

  const connectWallet = useCallback(async (nextWalletId: string) => {
    setConnecting(true);
    setError("");

    try {
      const { BrowserWallet } = await import("@meshsdk/core");
      const connectedWallet = await BrowserWallet.enable(nextWalletId);
      const nextAddress = await resolveWalletAddress(connectedWallet);
      const availableWallets = wallets.length > 0 ? wallets : await BrowserWallet.getAvailableWallets();
      const availableWallet = availableWallets.find((item) => item.id === nextWalletId);

      setWallet(connectedWallet);
      setWallets(availableWallets);
      setWalletId(nextWalletId);
      setWalletName(availableWallet?.name || nextWalletId);
      setAddress(nextAddress);
      window.localStorage.setItem(STORAGE_KEY, nextWalletId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect wallet.");
      throw err;
    } finally {
      setConnecting(false);
    }
  }, [wallets]);

  const disconnectWallet = useCallback(() => {
    setWallet(null);
    setWalletId("");
    setWalletName("");
    setAddress("");
    setError("");
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreWallet() {
      const storedWalletId = window.localStorage.getItem(STORAGE_KEY);
      if (!storedWalletId) return;

      try {
        setConnecting(true);
        const { BrowserWallet } = await import("@meshsdk/core");
        const availableWallets = await BrowserWallet.getAvailableWallets();
        const availableWallet = availableWallets.find((item) => item.id === storedWalletId);

        if (!availableWallet) {
          window.localStorage.removeItem(STORAGE_KEY);
          return;
        }

        const restoredWallet = await BrowserWallet.enable(storedWalletId);
        const restoredAddress = await resolveWalletAddress(restoredWallet);

        if (!isMounted) return;

        setWallet(restoredWallet);
        setWallets(availableWallets);
        setWalletId(storedWalletId);
        setWalletName(availableWallet.name || storedWalletId);
        setAddress(restoredAddress);
      } catch {
        if (isMounted) {
          window.localStorage.removeItem(STORAGE_KEY);
          setError("Unable to restore the previous wallet connection.");
        }
      } finally {
        if (isMounted) setConnecting(false);
      }
    }

    void restoreWallet();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      wallet,
      wallets,
      walletId,
      walletName,
      address,
      connected: Boolean(wallet && address),
      connecting,
      error,
      loadWallets,
      connectWallet,
      disconnectWallet,
    }),
    [address, connectWallet, connecting, disconnectWallet, error, loadWallets, wallet, walletId, walletName, wallets],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useAppWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useAppWallet must be used inside WalletProvider");
  }

  return context;
}
