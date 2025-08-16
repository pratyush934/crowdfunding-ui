"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/store";
import { ProposalAccount } from "@/hooks/useProposals";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Progress } from "./ui/progress";
import {
  Users,
  Check,
  X,
  Hourglass,
  Rocket,
  File,
  ExternalLink,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import Image from "next/image";

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

// Helper function to create buffer from proposal ID
const createProposalIdBuffer = (proposalId: any): Buffer => {
  if (typeof proposalId === "object" && proposalId.toNumber) {
    const idNumber = proposalId.toNumber();
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(idNumber), 0);
    return buffer;
  } else if (typeof proposalId === "bigint") {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(proposalId, 0);
    return buffer;
  } else if (typeof proposalId === "number") {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(idNumber), 0);
    return buffer;
  } else {
    const idNumber = Number(proposalId);
    if (isNaN(idNumber)) {
      throw new Error(`Invalid proposal ID: ${proposalId}`);
    }
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(BigInt(idNumber), 0);
    return buffer;
  }
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

        // Derive vote record PDA
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
    if (!connected || !publicKey || !governanceProgram) {
      toast.error("Please connect your wallet to vote.");
      return;
    }

    if (!isBondHolder) {
      toast.error("You must be a bond holder to vote.");
      return;
    }

    if (hasVoted) {
      toast.error("You have already voted on this proposal.");
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
    const toastId = toast.loading(`Casting ${voteYes ? "Yes" : "No"} vote...`);

    try {
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

      const tx = await governanceProgram.methods
        .castVote(voteYes)
        .accounts({
          proposal: proposal.publicKey,
          voter: publicKey,
          voterBondAccount: bondAccountPda,
          voteRecord: voteRecordPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success(`Successfully cast ${voteYes ? "Yes" : "No"} vote!`, {
        id: toastId,
        description: <p>Transaction: {tx}</p>,
      });

      if (onVoteSuccess) {
        onVoteSuccess();
      }
    } catch (err: any) {
      console.error("Error casting vote:", err);
      toast.error("Failed to cast vote.", {
        id: toastId,
        description: err.message || "An unknown error occurred.",
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
            className="text-yellow-500 border-yellow-500/50"
          >
            <Hourglass className="mr-1 h-3 w-3" />
            Voting
          </Badge>
        );
      case "succeeded":
        return (
          <Badge
            variant="outline"
            className="text-green-500 border-green-500/50"
          >
            <Check className="mr-1 h-3 w-3" />
            Succeeded
          </Badge>
        );
      case "executed":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500/50">
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

  const renderVotingSection = () => {
    if (!connected) {
      return (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Please connect your wallet to vote.
        </div>
      );
    }

    if (!isBondHolder) {
      return (
        <div className="text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          You must be a bond holder to vote.
        </div>
      );
    }

    if (hasVoted) {
      return (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Check className="h-4 w-4" />
          You have already voted on this proposal.
        </div>
      );
    }

    if (state !== "voting") {
      return (
        <div className="text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Proposal state is "{state}" - not in voting period.
        </div>
      );
    }

    if (!isInVotingPeriod) {
      return (
        <div className="text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Voting period has ended (current slot: {debugInfo.currentSlot}, start:{" "}
          {debugInfo.startSlot}, end: {debugInfo.endSlot}).
        </div>
      );
    }

    return (
      <div className="flex gap-2 w-full">
        <Button
          size="sm"
          disabled={isVoting}
          onClick={() => handleVote(true)}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Vote Yes
        </Button>
        <Button
          size="sm"
          disabled={isVoting}
          onClick={() => handleVote(false)}
          className="flex-1 bg-red-600 hover:bg-red-700"
        >
          Vote No
        </Button>
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-full hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Proposal #{proposal.id.toString()}
          </span>
          {renderStateBadge()}
        </div>
        <CardTitle className="pt-2">{proposal.description}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-green-600">
              Yes ({yesVotes.toLocaleString()})
            </span>
            <span className="text-sm font-medium text-red-600">
              No ({noVotes.toLocaleString()})
            </span>
          </div>
          <Progress value={yesPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{yesPercentage.toFixed(1)}% Yes</span>
            <span>{(100 - yesPercentage).toFixed(1)}% No</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span>{totalVotes.toLocaleString()} total votes</span>
          </div>
          {state === "voting" && (
            <div className="flex items-center text-yellow-600">
              <Clock className="mr-1 h-3 w-3" />
              <span className="text-xs">Voting Active</span>
            </div>
          )}
        </div>

        {proposal.ipfsUrl && (
          <div className="text-sm border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <File className="h-4 w-4" />
              <span className="font-medium">Proof of Intent</span>
              <a
                href={proposal.ipfsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {proposal.fileName && (
              <div className="text-xs text-muted-foreground mb-2">
                File: {proposal.fileName}
              </div>
            )}

            {isImageFile(proposal.fileName) && !imageError && (
              <div className="mt-2">
                <Image
                  src={proposal.ipfsUrl}
                  alt="Proof of Intent Preview"
                  width={200}
                  height={150}
                  className="object-cover rounded border max-w-full h-auto"
                  onError={() => setImageError(true)}
                />
              </div>
            )}
          </div>
        )}

        {/* Debug Info for Development */}
        {process.env.NODE_ENV === "development" && (
          <div className="text-xs text-muted-foreground mt-4">
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
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
