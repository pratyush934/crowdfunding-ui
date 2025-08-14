"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Copy, LogOut, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppStore } from "@/store";

export const WalletButton = () => {
  const { publicKey, wallet, disconnect } = useWallet();
  const { init } = useAppStore();

  // --- FIX APPLIED HERE ---
  // We now use the `publicKey` as the main trigger.
  // This useEffect will only run when the publicKey is available,
  // guaranteeing the wallet is fully connected and ready.
  useEffect(() => {
    if (publicKey && wallet) {
      init(wallet);
    }
  }, [publicKey, wallet, init]);

  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // We can simplify this check now to just look for the publicKey
  if (!publicKey) {
    return (
      <Button
        size="sm"
        className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/25"
        onClick={() => setVisible(true)}
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm">
        <span className="font-mono">{publicKey.toBase58()}</span>
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Copy address"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => disconnect()}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Disconnect</span>
      </Button>
    </div>
  );
};
