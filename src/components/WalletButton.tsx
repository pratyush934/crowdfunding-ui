"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "./ui/button";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Copy, LogOut, Check, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/store";

export const WalletButton = () => {
  const walletState = useWallet();
  const { publicKey, disconnect, connected } = walletState;

  const { init, isInitialized, error } = useAppStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showError, setShowError] = useState(false);

  // Use ref to track if we've already attempted initialization
  const hasTriedInit = useRef(false);
  const initTimeoutRef = useRef<NodeJS.Timeout>();

  // Stable initialization function
  const initializeStore = useCallback(async () => {
    if (isInitializing || isInitialized || hasTriedInit.current) {
      return;
    }

    if (!connected || !publicKey || !walletState.signTransaction) {
      console.log("Wallet not ready for initialization");
      return;
    }

    console.log("Starting store initialization...");
    setIsInitializing(true);
    hasTriedInit.current = true;

    try {
      await init(walletState);
      console.log("Store initialization completed");
    } catch (err) {
      console.error("Store initialization failed:", err);
    } finally {
      setIsInitializing(false);
    }
  }, [
    connected,
    publicKey,
    walletState.signTransaction,
    init,
    isInitializing,
    isInitialized,
  ]);

  // Reset initialization state when wallet disconnects
  useEffect(() => {
    if (!connected) {
      hasTriedInit.current = false;
      setIsInitializing(false);
      setShowError(false);

      // Clear any pending timeouts
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    }
  }, [connected]);

  // Initialize store when wallet connects (only once)
  useEffect(() => {
    if (
      connected &&
      publicKey &&
      !hasTriedInit.current &&
      !isInitializing &&
      !isInitialized
    ) {
      // Small delay to ensure wallet is fully ready
      initTimeoutRef.current = setTimeout(() => {
        initializeStore();
      }, 500);
    }

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, [connected, publicKey, initializeStore, isInitializing, isInitialized]);

  const { setVisible } = useWalletModal();

  const handleCopy = useCallback(() => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [publicKey]);

  const handleRetry = useCallback(() => {
    if (!isInitializing) {
      hasTriedInit.current = false;
      setShowError(false);
      initializeStore();
    }
  }, [isInitializing, initializeStore]);

  const handleDisconnect = useCallback(() => {
    hasTriedInit.current = false;
    setIsInitializing(false);
    setShowError(false);
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    disconnect();
  }, [disconnect]);

  // Show connect button if no public key
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
    <div className="relative flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-1.5 text-sm">
        <span className="font-mono">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </span>

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

        {/* Status indicators */}
        {isInitializing && (
          <div
            className="flex items-center gap-1"
            title="Initializing store..."
          >
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          </div>
        )}

        {error && !isInitializing && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowError(!showError)}
              className="text-red-500 hover:text-red-600 transition-colors"
              title="Initialization failed - click for details"
            >
              <AlertCircle className="h-4 w-4" />
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              className="h-auto p-1 text-xs hover:bg-red-50"
              title="Retry initialization"
            >
              Retry
            </Button>
          </div>
        )}

        {isInitialized && !error && !isInitializing && (
          <div
            className="h-2 w-2 bg-green-500 rounded-full"
            title="Store initialized successfully"
          />
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDisconnect}
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Disconnect</span>
      </Button>

      {/* Error popup */}
      {error && showError && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs max-w-sm z-50 shadow-lg">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold">Initialization Error:</p>
            <button
              onClick={() => setShowError(false)}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
          <p className="mb-2 break-words">{error}</p>
          <div className="text-xs text-red-600">
            <p className="font-medium">Possible causes:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>IDL files might be corrupted or have wrong format</li>
              <li>Program IDs don't match deployed programs</li>
              <li>Local Solana validator not running</li>
              <li>Network connection issues</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
