import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { SystemProgram, Transaction, PublicKey } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAppStore } from "@/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Shield,
  Wallet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

export default function AdminPanel() {
  const { governanceProgram } = useAppStore();
  const { publicKey, signTransaction, connected } = useWallet();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleInitializeDao = async () => {
    if (!governanceProgram || !publicKey || !signTransaction) {
      toast.error("Wallet not connected or program not initialized.");
      return;
    }

    setIsInitializing(true);

    try {
      const votingPeriod = new BN(100);
      const quorumVotes = new BN(1);

      // Derive the governance state PDA
      const [governanceStatePda] = PublicKey.findProgramAddressSync(
        [Buffer.from("governance_state")],
        governanceProgram.programId
      );

      console.log("Governance State PDA:", governanceStatePda.toBase58());
      console.log("Admin Public Key:", publicKey.toBase58());
      console.log("Program ID:", governanceProgram.programId.toBase58());

      // Build the transaction
      const builder = governanceProgram.methods
        .initializeGovernance(votingPeriod, quorumVotes)
        .accounts({
          governanceState: governanceStatePda,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        });

      const instruction = await builder.instruction();
      console.log("Instruction Data:", instruction.data.toString("hex"));

      const { blockhash, lastValidBlockHeight } =
        await governanceProgram.provider.connection.getRecentBlockhash();
      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      }).add(instruction);

      // Sign and send the transaction
      const signedTx = await signTransaction(tx);
      const signature =
        await governanceProgram.provider.connection.sendRawTransaction(
          signedTx.serialize()
        );
      const confirmation =
        await governanceProgram.provider.connection.confirmTransaction(
          signature,
          "confirmed"
        );

      console.log("Transaction Signature:", signature);
      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      toast.success("DAO Initialized Successfully!");
    } catch (error) {
      console.error("Error initializing DAO:", error);
      console.log("Full error object:", error);
      toast.error(
        `Error initializing DAO: ${error.message || "Unknown error"}`
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const handleVerifyMyWallet = async () => {
    if (!governanceProgram || !publicKey || !signTransaction) {
      toast.error("Wallet not connected or program not initialized.");
      return;
    }

    setIsVerifying(true);

    try {
      // Derive the verified user PDA
      const [verifiedUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verified_user"), publicKey.toBuffer()],
        governanceProgram.programId
      );

      console.log("Verified User PDA:", verifiedUserPda.toBase58());
      console.log("User Public Key:", publicKey.toBase58());

      // Build the transaction for add_verified_user
      const builder = governanceProgram.methods.addVerifiedUser().accounts({
        verifiedUser: verifiedUserPda,
        userToVerify: publicKey,
        admin: publicKey, // Assuming the caller is the admin for testing; adjust if needed
        systemProgram: SystemProgram.programId,
      });

      const instruction = await builder.instruction();
      console.log("Instruction Data:", instruction.data.toString("hex"));

      const { blockhash, lastValidBlockHeight } =
        await governanceProgram.provider.connection.getRecentBlockhash();
      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: publicKey,
      }).add(instruction);

      // Sign and send the transaction
      const signedTx = await signTransaction(tx);
      const signature =
        await governanceProgram.provider.connection.sendRawTransaction(
          signedTx.serialize()
        );
      const confirmation =
        await governanceProgram.provider.connection.confirmTransaction(
          signature,
          "confirmed"
        );

      console.log("Transaction Signature:", signature);
      if (confirmation.value.err) {
        throw new Error(
          `Transaction failed: ${JSON.stringify(confirmation.value.err)}`
        );
      }

      toast.success("Wallet Verified Successfully!");
    } catch (error) {
      console.error("Error verifying wallet:", error);
      console.log("Full error object:", error);
      toast.error(
        `Error verifying wallet: ${error.message || "Unknown error"}`
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const getConnectionStatus = () => {
    if (!connected) {
      return {
        status: "Disconnected",
        variant: "destructive" as const,
        icon: AlertCircle,
      };
    }
    if (!governanceProgram) {
      return {
        status: "Program Not Loaded",
        variant: "secondary" as const,
        icon: AlertCircle,
      };
    }
    return {
      status: "Connected",
      variant: "default" as const,
      icon: CheckCircle,
    };
  };

  const connectionInfo = getConnectionStatus();
  const StatusIcon = connectionInfo.icon;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <CardHeader className="space-y-4 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Panel
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                DAO administration tools for your local development environment
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={connectionInfo.variant}
            className="flex items-center gap-1.5 px-3 py-1"
          >
            <StatusIcon className="h-3.5 w-3.5" />
            {connectionInfo.status}
          </Badge>
        </div>

        {publicKey && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border">
            <div className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Connected Wallet:
              </span>
              <code className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded font-mono">
                {publicKey.toBase58().slice(0, 8)}...
                {publicKey.toBase58().slice(-8)}
              </code>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-6">
          {/* Step 1: Initialize DAO */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg">Initialize the DAO</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Create the main governance account on the blockchain
                </p>
              </div>
            </div>

            <div className="pl-11">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-3">
                <div className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-300">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">One-time setup required</p>
                    <p className="text-xs mt-1 opacity-90">
                      This will set up voting period: 100 slots, quorum: 1 vote
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleInitializeDao}
                disabled={!connected || !governanceProgram || isInitializing}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {isInitializing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Initializing DAO...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Initialize DAO
                  </div>
                )}
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Step 2: Verify Wallet */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg">Verify Your Wallet</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Add your wallet to the verified users list for proposal
                  creation
                </p>
              </div>
            </div>

            <div className="pl-11">
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-3">
                <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">
                      Verification required for proposals
                    </p>
                    <p className="text-xs mt-1 opacity-90">
                      Only verified wallets can create governance proposals
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleVerifyMyWallet}
                disabled={!connected || isVerifying}
                variant="outline"
                className="w-full h-12 border-2 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-all duration-200"
              >
                {isVerifying ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Verify My Wallet
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {!connected && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Wallet Connection Required</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1 ml-7">
              Please connect your wallet to Localnet (http://127.0.0.1:8899) to
              use admin functions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
