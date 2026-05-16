"use client";

import { useEffect, useRef, useState } from "react";
import { useAppWallet } from "./WalletProvider";
import styles from "./WalletConnect.module.css";

function shortenAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

export function WalletConnect() {
  const {
    address,
    connected,
    connecting,
    connectWallet,
    disconnectWallet,
    error,
    loadWallets,
    walletName,
    wallets,
  } = useAppWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [localError, setLocalError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  async function handleConnect(walletId: string) {
    setSelectedWallet(walletId);
    setLocalError("");

    try {
      await connectWallet(walletId);
      setIsOpen(false);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Unable to connect wallet.");
    } finally {
      setSelectedWallet("");
    }
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
            <button className={styles.disconnectButton} type="button" onClick={disconnectWallet}>
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
          setLocalError("");
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

          {localError || error ? <p className={styles.errorState}>{localError || error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
