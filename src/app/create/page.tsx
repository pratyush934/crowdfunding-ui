"use client";

import { CreateProposalForm } from "@/components/CreateProposals";
import { WalletButton } from "@/components/WalletButton";
import { useWallet } from "@solana/wallet-adapter-react";
import { Wallet } from "lucide-react";

export default function CreatePage() {
  const { connected } = useWallet();

  return (
    <div className="container py-10 flex flex-col items-center">
      {!connected ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg max-w-2xl w-full">
          <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
          <p className="text-muted-foreground mb-4">
            You must connect your wallet to create a new proposal.
          </p>
          <WalletButton />
        </div>
      ) : (
        <CreateProposalForm />
      )}
    </div>
  );
}
