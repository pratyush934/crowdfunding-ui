// Complete Proposals.tsx with enhanced UI and debug alerts

"use client";

import { ProposalAccount } from "@/hooks/useProposals";
import { useAppStore } from "@/store";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle,
  ExternalLink,
  File,
  Hourglass,
  Info,
  Rocket,
  Timer,
  Vote,
  Wallet,
  X,
  XCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { Progress } from "./ui/progress";

// Define the props that our component will accept
interface ProposalCardProps {
  proposal: ProposalAccount;
  onVoteSuccess?: () => void;
}

// Helper function to get the name of the proposal state
const getProposalState = (state: any): string => {
  return state || "unknown";
};

// Helper function to check if file is an image
const isImageFile = (fileName?: string): boolean => {
  return !!fileName && /\.(jpg|jpeg|png)$/i.test(fileName);
};

// Fixed helper function to create buffer from proposal ID (Browser-compatible version)
const createProposalIdBuffer = (proposalId: any): Buffer => {
  let idNumber: number;

  if (typeof proposalId === "object" && proposalId.toNumber) {
    idNumber = proposalId.toNumber();
  } else if (typeof proposalId === "bigint") {
    idNumber = Number(proposalId);
  } else if (typeof proposalId === "number") {
    idNumber = proposalId;
  } else {
    idNumber = Number(proposalId);
    if (isNaN(idNumber)) {
      throw new Error(`Invalid proposal ID: ${proposalId}`);
    }
  }

  // Use DataView instead of buffer.writeBigUInt64LE for browser compatibility
  const buffer = Buffer.alloc(8);
  const view = new DataView(buffer.buffer);
  view.setBigUint64(0, BigInt(idNumber), true); // true for little-endian
  return buffer;
};

export const ProposalCard = ({
  proposal,
  onVoteSuccess,
}: ProposalCardProps) => {
  const { connected, publicKey } = useWallet();
  const { governanceProgram } = useAppStore();
  const [isVoting, setIsVoting] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isBondHolder, setIsBondHolder] = useState<boolean | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean | null>(null);
  const [isInVotingPeriod, setIsInVotingPeriod] = useState<boolean | null>(
    null
  );
  const [showDebug, setShowDebug] = useState(false);

  const state = getProposalState(proposal.state);
  const yesVotes = proposal.yesVotes.toNumber();
  const noVotes = proposal.noVotes.toNumber();
  const totalVotes = yesVotes + noVotes;
  const yesPercentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;

  // Check bond holder status, vote status, and voting period
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!connected || !publicKey || !governanceProgram) {
        setDebugInfo({
          connected,
          publicKey: publicKey ? publicKey.toString() : "Not connected",
          governanceProgram: !!governanceProgram,
        });
        setIsBondHolder(false);
        setHasVoted(false);
        setIsInVotingPeriod(false);
        return;
      }

      try {
        // Derive bond account PDA
        const [bondAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("bond"), publicKey.toBuffer()],
          new PublicKey("6ongwoyXhZ119UcadKiAMyJf8adB7J9JwVpUNDD7hD5G")
        );

        // Check bond account
        const bondAccount =
          await governanceProgram.provider.connection.getAccountInfo(
            bondAccountPda
          );
        setIsBondHolder(!!bondAccount);
        setDebugInfo((prev: any) => ({
          ...prev,
          bondAccount: bondAccount
            ? "Bond account exists"
            : "No bond account found",
          bondAccountPda: bondAccountPda.toString(),
        }));

        // Derive vote record PDA using the fixed buffer function
        const [voteRecordPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("vote"),
            createProposalIdBuffer(proposal.id),
            publicKey.toBuffer(),
          ],
          governanceProgram.programId
        );

        // Check if user has voted
        const voteRecord =
          await governanceProgram.provider.connection.getAccountInfo(
            voteRecordPda
          );
        setHasVoted(!!voteRecord);
        setDebugInfo((prev: any) => ({
          ...prev,
          hasVoted: !!voteRecord,
          voteRecordPda: voteRecordPda.toString(),
        }));

        // Check voting period
        const currentSlot =
          await governanceProgram.provider.connection.getSlot();
        const isInPeriod =
          proposal.startSlot.toNumber() <= currentSlot &&
          currentSlot <= proposal.endSlot.toNumber();
        setIsInVotingPeriod(isInPeriod);
        setDebugInfo((prev: any) => ({
          ...prev,
          currentSlot,
          startSlot: proposal.startSlot.toNumber(),
          endSlot: proposal.endSlot.toNumber(),
          isInVotingPeriod: isInPeriod,
          proposalState: state,
        }));
      } catch (err: any) {
        console.error("Error checking user status:", err);
        setDebugInfo((prev: any) => ({
          ...prev,
          error: err.message || "Unknown error checking status",
        }));
      }
    };

    checkUserStatus();
  }, [
    connected,
    publicKey,
    governanceProgram,
    proposal.id,
    proposal.startSlot,
    proposal.endSlot,
    state,
  ]);

  const handleVote = async (voteYes: boolean) => {
    // Prevent double-clicking
    if (isVoting) {
      toast.error("Vote already in progress", {
        description: "Please wait for the current transaction to complete.",
      });
      return;
    }

    if (!connected || !publicKey || !governanceProgram) {
      toast.error("Please connect your wallet to vote.");
      return;
    }

    if (!isBondHolder) {
      toast.error("You must be a bond holder to vote.");
      return;
    }

    if (state !== "voting") {
      toast.error("Voting is not active for this proposal.");
      return;
    }

    if (!isInVotingPeriod) {
      toast.error("Voting period has ended for this proposal.");
      return;
    }

    setIsVoting(true);
    const toastId = toast.loading(
      `Preparing to cast ${voteYes ? "YES" : "NO"} vote...`
    );

    try {
      // Re-derive PDAs to ensure they're correct
      const [voteRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("vote"),
          createProposalIdBuffer(proposal.id),
          publicKey.toBuffer(),
        ],
        governanceProgram.programId
      );

      const [bondAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bond"), publicKey.toBuffer()],
        new PublicKey("6ongwoyXhZ119UcadKiAMyJf8adB7J9JwVpUNDD7hD5G")
      );

      const proposalPda =
        proposal.publicKey ||
        PublicKey.findProgramAddressSync(
          [Buffer.from("proposal"), createProposalIdBuffer(proposal.id)],
          governanceProgram.programId
        )[0];

      toast.loading("Checking voting eligibility...", { id: toastId });

      // CRITICAL: Double-check if vote record already exists
      const connection = governanceProgram.provider.connection;
      const voteRecordAccount = await connection.getAccountInfo(voteRecordPda);

      if (voteRecordAccount) {
        setHasVoted(true); // Update local state
        toast.error("You have already voted!", {
          id: toastId,
          description: "Your vote has already been recorded for this proposal.",
        });
        return;
      }

      // Verify other required accounts
      const [proposalAccount, bondAccount] = await Promise.all([
        connection.getAccountInfo(proposalPda),
        connection.getAccountInfo(bondAccountPda),
      ]);

      if (!proposalAccount) {
        toast.error("Proposal not found!", { id: toastId });
        return;
      }

      if (!bondAccount) {
        toast.error("Bond account not found - you are not a bond holder!", {
          id: toastId,
        });
        return;
      }

      toast.loading(
        `Submitting ${voteYes ? "YES" : "NO"} vote to blockchain...`,
        { id: toastId }
      );

      const tx = await governanceProgram.methods
        .castVote(voteYes)
        .accounts({
          proposal: proposalPda,
          voter: publicKey,
          voterBondAccount: bondAccountPda,
          voteRecord: voteRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success(`🎉 ${voteYes ? "YES" : "NO"} vote cast successfully!`, {
        id: toastId,
        description: (
          <div className="space-y-1">
            <p className="font-medium">Your vote has been recorded!</p>
            <p className="text-xs opacity-75">
              Transaction: {tx.slice(0, 8)}...{tx.slice(-8)}
            </p>
          </div>
        ),
      });

      // Update local state immediately
      setHasVoted(true);

      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (err: any) {
      console.error("Error casting vote:", err);

      let errorMessage = "Failed to cast vote";
      let errorDescription = err.message || "Unknown error";

      if (err.message?.includes("already in use")) {
        errorMessage = "Already Voted";
        errorDescription = "You have already voted on this proposal.";
        setHasVoted(true); // Update local state
      } else if (err.message?.includes("custom program error: 0x0")) {
        errorMessage = "Transaction Failed";
        errorDescription =
          "The blockchain rejected the vote. You may have already voted.";
      } else if (err.message?.includes("User rejected")) {
        errorMessage = "Transaction Cancelled";
        errorDescription = "You cancelled the transaction in your wallet.";
      }

      toast.error(errorMessage, {
        id: toastId,
        description: errorDescription,
      });
    } finally {
      setIsVoting(false);
    }
  };

  // Helper function to render the correct badge based on the state
  const renderStateBadge = () => {
    switch (state) {
      case "voting":
        return (
          <Badge
            variant="outline"
            className="text-yellow-600 border-yellow-500/50 bg-yellow-50"
          >
            <Hourglass className="mr-1 h-3 w-3" />
            Voting
          </Badge>
        );
      case "succeeded":
        return (
          <Badge
            variant="outline"
            className="text-green-600 border-green-500/50 bg-green-50"
          >
            <Check className="mr-1 h-3 w-3" />
            Succeeded
          </Badge>
        );
      case "executed":
        return (
          <Badge
            variant="outline"
            className="text-blue-600 border-blue-500/50 bg-blue-50"
          >
            <Rocket className="mr-1 h-3 w-3" />
            Executed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <X className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  const renderStatusAlert = () => {
    if (!connected) {
      return (
        <Alert className="border-orange-200 bg-orange-50">
          <Wallet className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">
            Wallet Not Connected
          </AlertTitle>
          <AlertDescription className="text-orange-700">
            Connect your wallet to participate in voting
          </AlertDescription>
        </Alert>
      );
    }

    if (
      isBondHolder === null ||
      hasVoted === null ||
      isInVotingPeriod === null
    ) {
      return (
        <Alert className="border-blue-200 bg-blue-50">
          <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
          <AlertTitle className="text-blue-800">Checking Status</AlertTitle>
          <AlertDescription className="text-blue-700">
            Verifying your voting eligibility...
          </AlertDescription>
        </Alert>
      );
    }

    if (!isBondHolder) {
      return (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Not Eligible</AlertTitle>
          <AlertDescription className="text-red-700">
            You must be a bond holder to vote on proposals
          </AlertDescription>
        </Alert>
      );
    }

    if (hasVoted) {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Vote Recorded</AlertTitle>
          <AlertDescription className="text-green-700">
            Your vote has been successfully recorded on the blockchain
          </AlertDescription>
        </Alert>
      );
    }

    if (state !== "voting") {
      return (
        <Alert className="border-gray-200 bg-gray-50">
          <AlertCircle className="h-4 w-4 text-gray-600" />
          <AlertTitle className="text-gray-800">Voting Closed</AlertTitle>
          <AlertDescription className="text-gray-700">
            This proposal is in "{state}" state - voting is not active
          </AlertDescription>
        </Alert>
      );
    }

    if (!isInVotingPeriod) {
      const slotsRemaining = debugInfo.endSlot - debugInfo.currentSlot;
      return (
        <Alert className="border-red-200 bg-red-50">
          <Timer className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Voting Period Ended</AlertTitle>
          <AlertDescription className="text-red-700">
            Voting ended {Math.abs(slotsRemaining)} slots ago
            <div className="text-xs mt-1 opacity-75">
              Period: Slot {debugInfo.startSlot} - {debugInfo.endSlot} (Current:{" "}
              {debugInfo.currentSlot})
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    // Show voting is active with time warning
    const slotsRemaining = debugInfo.endSlot - debugInfo.currentSlot;
    const timeRemaining = slotsRemaining * 0.4; // ~0.4 seconds per slot

    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Timer className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800 flex items-center gap-2">
          Voting Active
          <Badge
            variant="outline"
            className="text-xs bg-yellow-100 border-yellow-300"
          >
            {slotsRemaining} slots left
          </Badge>
        </AlertTitle>
        <AlertDescription className="text-yellow-700">
          <div className="flex items-center justify-between">
            <span>
              Vote quickly! ~{Math.max(0, Math.round(timeRemaining))}s remaining
            </span>
            <div className="text-xs opacity-75">
              Ends at slot {debugInfo.endSlot}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  const renderVotingSection = () => {
    if (state !== "voting" || !isInVotingPeriod || !isBondHolder || hasVoted) {
      return null;
    }

    return (
      <div className="space-y-3">
        {/* Voting buttons */}
        <div className="flex gap-3 w-full">
          <Button
            size="lg"
            disabled={isVoting}
            onClick={() => handleVote(true)}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 h-12 font-semibold"
          >
            {isVoting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Vote YES
              </div>
            )}
          </Button>

          <Button
            size="lg"
            disabled={isVoting}
            onClick={() => handleVote(false)}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 h-12 font-semibold"
          >
            {isVoting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Vote NO
              </div>
            )}
          </Button>
        </div>

        {/* Processing feedback */}
        {isVoting && (
          <Alert className="border-blue-200 bg-blue-50">
            <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
            <AlertTitle className="text-blue-800">
              Transaction in Progress
            </AlertTitle>
            <AlertDescription className="text-blue-700">
              Please wait and don't click again! Your vote is being recorded on
              the blockchain.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-muted-foreground">
            Proposal #{proposal.id.toString()}
          </span>
          {renderStateBadge()}
        </div>
        <CardTitle className="text-lg leading-tight">
          {proposal.description}
        </CardTitle>

        {/* Status Alert */}
        {renderStatusAlert()}
      </CardHeader>

      <CardContent className="flex-grow space-y-4">
        {/* Voting Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-600 flex items-center gap-1">
              <Vote className="h-3 w-3" />
              Yes ({yesVotes.toLocaleString()})
            </span>
            <span className="text-sm font-medium text-red-600 flex items-center gap-1">
              <Vote className="h-3 w-3" />
              No ({noVotes.toLocaleString()})
            </span>
          </div>
          <Progress value={yesPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{yesPercentage.toFixed(1)}% Yes</span>
            <span>{totalVotes.toLocaleString()} total votes</span>
            <span>{(100 - yesPercentage).toFixed(1)}% No</span>
          </div>
        </div>

        {/* IPFS File */}
        {proposal.ipfsUrl && (
          <Alert className="border-blue-200 bg-blue-50">
            <File className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 flex items-center justify-between">
              Proof of Intent
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-blue-600 hover:text-blue-800"
                onClick={() => window.open(proposal.ipfsUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </AlertTitle>
            <AlertDescription className="text-blue-700">
              {proposal.fileName ? (
                <span className="font-mono text-xs">{proposal.fileName}</span>
              ) : (
                <span>Supporting documentation available on IPFS</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Information (Collapsible) */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="flex items-center gap-2">
                <Info className="h-3 w-3" />
                Technical Details
              </span>
              <span className="text-xs">
                Click to {showDebug ? "hide" : "show"}
              </span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2">
            <Alert className="border-gray-200 bg-gray-50">
              <Activity className="h-4 w-4 text-gray-600" />
              <AlertTitle className="text-gray-800 text-sm">
                Blockchain Status
              </AlertTitle>
              <AlertDescription className="text-gray-700">
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span>Bond Account:</span>
                    <span
                      className={
                        isBondHolder ? "text-green-600" : "text-red-600"
                      }
                    >
                      {debugInfo.bondAccount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Has Voted:</span>
                    <span
                      className={hasVoted ? "text-blue-600" : "text-gray-600"}
                    >
                      {hasVoted ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Slot:</span>
                    <span>{debugInfo.currentSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Voting Period:</span>
                    <span>
                      {debugInfo.startSlot} - {debugInfo.endSlot}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>In Period:</span>
                    <span
                      className={
                        isInVotingPeriod ? "text-green-600" : "text-red-600"
                      }
                    >
                      {isInVotingPeriod ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-4 border-t">
        {renderVotingSection()}

        <div className="flex gap-2 w-full">
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            Share
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
