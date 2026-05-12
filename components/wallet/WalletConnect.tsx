"use client";

import { useEffect, useRef, useState } from "react";
import type { BrowserWallet } from "@meshsdk/core";
import type { Wallet } from "@meshsdk/common";
import styles from "./WalletConnect.module.css";

function shortenAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function WalletConnect() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [walletName, setWalletName] = useState("");
  const [address, setAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const connected = Boolean(wallet && address);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  async function loadWallets() {
    setError("");

    try {
      const { BrowserWallet } = await import("@meshsdk/core");
      setWallets(await BrowserWallet.getAvailableWallets());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to detect wallet extensions.");
    }
  }

  async function handleConnect(walletId: string) {
    setConnecting(true);
    setSelectedWallet(walletId);
    setError("");

    try {
      const { BrowserWallet } = await import("@meshsdk/core");
      const connectedWallet = await BrowserWallet.enable(walletId);
      const usedAddresses = await connectedWallet.getUsedAddresses();
      const changeAddress = await connectedWallet.getChangeAddress();

      setWallet(connectedWallet);
      setWalletName(wallets.find((availableWallet) => availableWallet.id === walletId)?.name || walletId);
      setAddress(usedAddresses[0] || changeAddress || "");
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect wallet.");
    } finally {
      setConnecting(false);
      setSelectedWallet("");
    }
  }

  function handleDisconnect() {
    setWallet(null);
    setWalletName("");
    setAddress("");
    setIsOpen(false);
  }

  if (connected) {
    return (
      <div className={styles.walletRoot} ref={rootRef}>
        <button
          className={styles.connectedButton}
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
        >
          <span>{walletName || "Connected"}</span>
          <b>{shortenAddress(address)}</b>
        </button>

        {isOpen ? (
          <div className={styles.walletMenu}>
            <div className={styles.walletStatus}>
              <span>Connected wallet</span>
              <strong>{shortenAddress(address)}</strong>
            </div>
            <button className={styles.disconnectButton} type="button" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.walletRoot} ref={rootRef}>
      <button
        className={styles.connectButton}
        type="button"
        onClick={() => {
          setIsOpen((current) => {
            if (!current) void loadWallets();
            return !current;
          });
          setError("");
        }}
        aria-expanded={isOpen}
      >
        Connect wallet
      </button>

      {isOpen ? (
        <div className={styles.walletMenu}>
          <div className={styles.walletMenuHeader}>
            <span>Select wallet extension</span>
            <p>Choose an installed Cardano wallet to connect.</p>
          </div>

          <div className={styles.walletList}>
            {wallets.length > 0 ? (
              wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => handleConnect(wallet.id)}
                  disabled={connecting || selectedWallet === wallet.id}
                >
                  <i style={{ backgroundImage: `url(${wallet.icon})` }} aria-hidden="true" />
                  <span>{wallet.name}</span>
                  <b>{selectedWallet === wallet.id ? "Connecting" : wallet.version}</b>
                </button>
              ))
            ) : (
              <p className={styles.emptyState}>No Cardano wallet extensions found.</p>
            )}
          </div>

          {error ? <p className={styles.errorState}>{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
