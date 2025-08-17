"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/store";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { toast } from "sonner";
import { ProposalAccount } from "@/hooks/useProposals";
import { Badge } from "./ui/badge";
import {
  FileText,
  Users,
  Clock,
  Check,
  X,
  Shield,
  RefreshCw,
  UserPlus,
  UserMinus,
  Settings,
  TrendingUp,
  AlertCircle,
  Eye,
  Calendar,
  Gavel,
} from "lucide-react";
import Link from "next/link";

interface GovernanceState {
  admin: PublicKey;
  proposalCount: number;
  votingPeriod: number;
  quorumVotes: number;
}

interface VerifiedUser {
  publicKey: string;
  authority: PublicKey;
  isVerified: boolean;
  addedAt?: Date;
}

interface ProposalStats {
  total: number;
  active: number;
  succeeded: number;
  failed: number;
  totalBondAmount: number;
  averageVotes: number;
}

export default function Governance() {
  const { connected, publicKey } = useWallet();
  const { governanceProgram, connection } = useAppStore();

  const [governanceState, setGovernanceState] =
    useState<GovernanceState | null>(null);
  const [proposals, setProposals] = useState<ProposalAccount[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [proposalStats, setProposalStats] = useState<ProposalStats>({
    total: 0,
    active: 0,
    succeeded: 0,
    failed: 0,
    totalBondAmount: 0,
    averageVotes: 0,
  });

  const [userToVerify, setUserToVerify] = useState("");
  const [userToRemove, setUserToRemove] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch all governance data
  const fetchGovernanceData = async () => {
    if (!governanceProgram || !connection) return;

    setIsRefreshing(true);
    try {
      // Get current slot
      const slot = await connection.getSlot();
      setCurrentSlot(slot);

      // Fetch governance state using correct PDA seeds
      const [govState] = PublicKey.findProgramAddressSync(
        [Buffer.from("governance_state")],
        governanceProgram.programId
      );

      try {
        const state = await governanceProgram.account.governanceState.fetch(
          govState
        );
        const govStateData = {
          admin: state.admin,
          proposalCount: state.proposalCount.toNumber(),
          votingPeriod: state.votingPeriod.toNumber(),
          quorumVotes: state.quorumVotes.toNumber(),
        };
        setGovernanceState(govStateData);

        // Check if current user is admin
        if (publicKey) {
          setIsAdmin(state.admin.equals(publicKey));
        }
      } catch (error) {
        console.error("Error fetching governance state:", error);
        toast.error("Failed to fetch governance state");
      }

      // Fetch all proposals
      try {
        const proposalAccounts = await governanceProgram.account.proposal.all();
        const proposalsData = proposalAccounts.map(
          ({ account, publicKey }) => ({
            ...account,
            publicKey,
          })
        );
        setProposals(proposalsData);

        // Calculate proposal statistics
        const stats = calculateProposalStats(proposalsData);
        setProposalStats(stats);
      } catch (error) {
        console.error("Error fetching proposals:", error);
        toast.error("Failed to fetch proposals");
      }

      // Fetch verified users if admin
      if (isAdmin) {
        await fetchVerifiedUsers();
      }

      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("Error fetching governance data:", error);
      toast.error("Failed to load governance data", {
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate proposal statistics
  const calculateProposalStats = (
    proposalsData: ProposalAccount[]
  ): ProposalStats => {
    const stats: ProposalStats = {
      total: proposalsData.length,
      active: 0,
      succeeded: 0,
      failed: 0,
      totalBondAmount: 0,
      averageVotes: 0,
    };

    let totalVotes = 0;

    proposalsData.forEach((proposal) => {
      try {
        // Handle different possible types for state
        let state: number;
        if (typeof proposal.state === "number") {
          state = proposal.state;
        } else if (
          proposal.state &&
          typeof proposal.state.toNumber === "function"
        ) {
          state = proposal.state.toNumber();
        } else if (
          proposal.state &&
          typeof proposal.state === "object" &&
          "toNumber" in proposal.state
        ) {
          state = (proposal.state as any).toNumber();
        } else {
          console.warn("Unable to parse proposal state:", proposal.state);
          state = 0; // Default to active
        }

        // Handle different possible types for bondAmount
        let bondAmount: number = 0;
        if (typeof proposal.bondAmount === "number") {
          bondAmount = proposal.bondAmount;
        } else if (
          proposal.bondAmount &&
          typeof proposal.bondAmount.toNumber === "function"
        ) {
          bondAmount = proposal.bondAmount.toNumber();
        } else if (
          proposal.bondAmount &&
          typeof proposal.bondAmount === "object" &&
          "toNumber" in proposal.bondAmount
        ) {
          bondAmount = (proposal.bondAmount as any).toNumber();
        }

        // Handle different possible types for votes
        let yesVotes: number = 0;
        if (typeof proposal.yesVotes === "number") {
          yesVotes = proposal.yesVotes;
        } else if (
          proposal.yesVotes &&
          typeof proposal.yesVotes.toNumber === "function"
        ) {
          yesVotes = proposal.yesVotes.toNumber();
        } else if (
          proposal.yesVotes &&
          typeof proposal.yesVotes === "object" &&
          "toNumber" in proposal.yesVotes
        ) {
          yesVotes = (proposal.yesVotes as any).toNumber();
        }

        let noVotes: number = 0;
        if (typeof proposal.noVotes === "number") {
          noVotes = proposal.noVotes;
        } else if (
          proposal.noVotes &&
          typeof proposal.noVotes.toNumber === "function"
        ) {
          noVotes = proposal.noVotes.toNumber();
        } else if (
          proposal.noVotes &&
          typeof proposal.noVotes === "object" &&
          "toNumber" in proposal.noVotes
        ) {
          noVotes = (proposal.noVotes as any).toNumber();
        }

        stats.totalBondAmount += bondAmount;
        totalVotes += yesVotes + noVotes;

        if (state === 0) stats.active++;
        else if (state === 1) stats.succeeded++;
        else if (state === 2) stats.failed++;
        else {
          // Handle unknown states
          console.warn("Unknown proposal state:", state);
          stats.active++; // Default to active for unknown states
        }
      } catch (error) {
        console.error("Error processing proposal:", proposal, error);
        // Skip this proposal if we can't process it
        stats.active++; // Default to active for error cases
      }
    });

    stats.averageVotes =
      stats.total > 0 ? Math.round(totalVotes / stats.total) : 0;

    return stats;
  };

  // Fetch all verified users (admin only)
  const fetchVerifiedUsers = async () => {
    if (!governanceProgram || !isAdmin) return;

    try {
      // This would need to be implemented based on your program's structure
      // For now, we'll show a placeholder since there's no direct way to fetch all verified users
      // You might need to implement an event-based system or keep a registry
      setVerifiedUsers([]);
    } catch (error) {
      console.error("Error fetching verified users:", error);
    }
  };

  // Handle adding verified user
  const handleAddVerifiedUser = async () => {
    if (!connected || !publicKey || !governanceProgram) {
      toast.error("Please connect your wallet.");
      return;
    }

    if (!isAdmin) {
      toast.error("Only the admin can add verified users.");
      return;
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(userToVerify);
    } catch {
      toast.error("Invalid public key.");
      return;
    }

    // Check if user is already verified
    try {
      const [verifiedUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verified_user"), userPubkey.toBuffer()],
        governanceProgram.programId
      );

      const existingAccount = await connection.getAccountInfo(verifiedUserPda);
      if (existingAccount) {
        toast.error("User is already verified.");
        return;
      }
    } catch (error) {
      // Account doesn't exist, which is what we want
    }

    setIsLoading(true);
    const toastId = toast.loading("Adding verified user...");

    try {
      const [verifiedUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verified_user"), userPubkey.toBuffer()],
        governanceProgram.programId
      );

      const tx = await governanceProgram.methods
        .addVerifiedUser()
        .accounts({
          verifiedUser: verifiedUserPda,
          userToVerify: userPubkey,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Verified user added successfully!", {
        id: toastId,
        description: `Transaction: ${tx}`,
      });

      setUserToVerify("");

      // Refresh data
      await fetchGovernanceData();
    } catch (err: any) {
      console.error("Error adding verified user:", err);

      let errorMessage = "Failed to add verified user.";
      if (err.message?.includes("already in use")) {
        errorMessage = "User is already verified.";
      }

      toast.error(errorMessage, {
        id: toastId,
        description: err.message || "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle removing verified user (if your program supports it)
  const handleRemoveVerifiedUser = async () => {
    if (!connected || !publicKey || !governanceProgram || !isAdmin) {
      toast.error("Unauthorized action.");
      return;
    }

    let userPubkey: PublicKey;
    try {
      userPubkey = new PublicKey(userToRemove);
    } catch {
      toast.error("Invalid public key.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Removing verified user...");

    try {
      const [verifiedUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verified_user"), userPubkey.toBuffer()],
        governanceProgram.programId
      );

      // Check if account exists
      const accountInfo = await connection.getAccountInfo(verifiedUserPda);
      if (!accountInfo) {
        toast.error("User is not verified.", { id: toastId });
        return;
      }

      // Assuming your program has a remove_verified_user method
      const tx = await governanceProgram.methods
        .removeVerifiedUser()
        .accounts({
          verifiedUser: verifiedUserPda,
          userToRemove: userPubkey,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Verified user removed successfully!", {
        id: toastId,
        description: `Transaction: ${tx}`,
      });

      setUserToRemove("");
      await fetchGovernanceData();
    } catch (err: any) {
      console.error("Error removing verified user:", err);
      toast.error("Failed to remove verified user.", {
        id: toastId,
        description: err.message || "Method may not be implemented.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get proposal status badge
  const getProposalStatusBadge = (state: number, endSlot?: number) => {
    const isExpired = endSlot && currentSlot > endSlot;

    if (state === 0) {
      return (
        <Badge variant={isExpired ? "destructive" : "default"}>
          {isExpired ? "Expired" : "Voting"}
        </Badge>
      );
    } else if (state === 1) {
      return (
        <Badge variant="default" className="bg-green-600">
          Succeeded
        </Badge>
      );
    } else {
      return <Badge variant="destructive">Failed</Badge>;
    }
  };

  // Format time remaining for voting
  const getTimeRemaining = (endSlot: number) => {
    if (!endSlot) return "N/A";

    const slotsRemaining = Math.max(0, endSlot - currentSlot);
    const secondsRemaining = Math.round(slotsRemaining * 0.4); // Approximate slot time

    if (secondsRemaining <= 0) return "Expired";
    if (secondsRemaining < 60) return `${secondsRemaining}s left`;

    const minutesRemaining = Math.floor(secondsRemaining / 60);
    return `${minutesRemaining}m left`;
  };

  useEffect(() => {
    fetchGovernanceData();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchGovernanceData, 15000);
    return () => clearInterval(interval);
  }, [governanceProgram, publicKey, connection, isAdmin]);

  if (!connected) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              <span>
                Please connect your wallet to access governance features.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gavel className="h-8 w-8" />
            CrypTrust DAO Governance
          </h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          onClick={fetchGovernanceData}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Admin Status Alert */}
      {isAdmin && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-800">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Admin Access Granted</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              You have administrative privileges to manage verified users and
              governance settings.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Governance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Proposals
                </p>
                <p className="text-2xl font-bold">{proposalStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Voting
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {proposalStats.active}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {proposalStats.total > 0
                    ? Math.round(
                        (proposalStats.succeeded / proposalStats.total) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
              <Check className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Votes
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {proposalStats.averageVotes}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Governance State Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Governance Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          {governanceState ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Admin Address</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {governanceState.admin.toString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Voting Period</p>
                    <p className="text-sm text-muted-foreground">
                      {governanceState.votingPeriod} slots (~
                      {Math.round(governanceState.votingPeriod * 0.4)} seconds)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Quorum Requirement</p>
                    <p className="text-sm text-muted-foreground">
                      {governanceState.quorumVotes} votes minimum
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Current Slot</p>
                    <p className="text-sm text-muted-foreground">
                      {currentSlot.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Loading governance configuration...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add Verified User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add Verified User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userToVerify">User Public Key</Label>
                <Input
                  id="userToVerify"
                  value={userToVerify}
                  onChange={(e) => setUserToVerify(e.target.value)}
                  placeholder="Enter public key to verify"
                  className="font-mono text-sm"
                />
              </div>
              <Button
                onClick={handleAddVerifiedUser}
                disabled={isLoading || !userToVerify}
                className="w-full"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding User...
                  </div>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Verified User
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Remove Verified User */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserMinus className="h-5 w-5" />
                Remove Verified User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userToRemove">User Public Key</Label>
                <Input
                  id="userToRemove"
                  value={userToRemove}
                  onChange={(e) => setUserToRemove(e.target.value)}
                  placeholder="Enter public key to remove"
                  className="font-mono text-sm"
                />
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    disabled={isLoading || !userToRemove}
                    className="w-full"
                  >
                    <UserMinus className="h-4 w-4 mr-2" />
                    Remove Verified User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Verified User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove verification for this
                      user? They will no longer be able to create proposals.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveVerifiedUser}>
                      Remove User
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Proposals Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              All Proposals ({proposals.length})
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/proposals">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {proposalStats.total > 0 && (
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Proposals</span>
                    <span>
                      {proposalStats.active}/{proposalStats.total}
                    </span>
                  </div>
                  <Progress
                    value={(proposalStats.active / proposalStats.total) * 100}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Succeeded</span>
                    <span>
                      {proposalStats.succeeded}/{proposalStats.total}
                    </span>
                  </div>
                  <Progress
                    value={
                      (proposalStats.succeeded / proposalStats.total) * 100
                    }
                    className="bg-green-100"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Failed</span>
                    <span>
                      {proposalStats.failed}/{proposalStats.total}
                    </span>
                  </div>
                  <Progress
                    value={(proposalStats.failed / proposalStats.total) * 100}
                    className="bg-red-100"
                  />
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="h-96 w-full">
            <div className="space-y-4">
              {proposals.length > 0 ? (
                proposals
                  .sort((a, b) => {
                    // Safe sorting by ID
                    const aId =
                      typeof a.id === "number"
                        ? a.id
                        : a.id && typeof a.id.toNumber === "function"
                        ? a.id.toNumber()
                        : 0;
                    const bId =
                      typeof b.id === "number"
                        ? b.id
                        : b.id && typeof b.id.toNumber === "function"
                        ? b.id.toNumber()
                        : 0;
                    return bId - aId;
                  })
                  .map((proposal) => {
                    // Safe extraction of values
                    const getNumberValue = (value: any): number => {
                      if (typeof value === "number") return value;
                      if (value && typeof value.toNumber === "function")
                        return value.toNumber();
                      if (
                        value &&
                        typeof value === "object" &&
                        "toNumber" in value
                      )
                        return (value as any).toNumber();
                      return 0;
                    };

                    const endSlot = getNumberValue(proposal.votingEndSlot);
                    const yesVotes = getNumberValue(proposal.yesVotes);
                    const noVotes = getNumberValue(proposal.noVotes);
                    const totalVotes = yesVotes + noVotes;
                    const bondAmount = getNumberValue(proposal.bondAmount);
                    const state = getNumberValue(proposal.state);
                    const proposalId = getNumberValue(proposal.id);

                    return (
                      <div
                        key={proposal.publicKey.toString()}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {proposal.bondPurpose || "Untitled Proposal"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Proposal #{proposalId} •{" "}
                              {proposal.bondSector || "Unknown Sector"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getProposalStatusBadge(
                              state,
                              endSlot || undefined
                            )}
                            {endSlot && state === 0 && (
                              <Badge variant="outline" className="text-xs">
                                {getTimeRemaining(endSlot)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <p className="text-sm mb-3 line-clamp-2">
                          {proposal.description || "No description provided"}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Bond Amount</p>
                            <p className="font-medium">
                              {(bondAmount / 1_000_000_000).toFixed(3)} SOL
                            </p>
                          </div>

                          <div>
                            <p className="text-muted-foreground">Proposer</p>
                            <p className="font-mono text-xs">
                              {proposal.proposer?.toString().slice(0, 8) ||
                                "Unknown"}
                              ...
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-green-600 font-medium">
                              {yesVotes}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <X className="h-4 w-4 text-red-600" />
                            <span className="text-red-600 font-medium">
                              {noVotes}
                            </span>
                          </div>
                        </div>

                        {totalVotes > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Voting Progress</span>
                              <span>{totalVotes} total votes</span>
                            </div>
                            <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="bg-green-500"
                                style={{
                                  width:
                                    totalVotes > 0
                                      ? `${(yesVotes / totalVotes) * 100}%`
                                      : "0%",
                                }}
                              />
                              <div
                                className="bg-red-500"
                                style={{
                                  width:
                                    totalVotes > 0
                                      ? `${(noVotes / totalVotes) * 100}%`
                                      : "0%",
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No proposals found.</p>
                  <p className="text-sm">
                    Create the first proposal to get started!
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild>
              <Link href="/proposals">
                <Eye className="h-4 w-4 mr-2" />
                View All Proposals
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/create">
                <FileText className="h-4 w-4 mr-2" />
                Create Proposal
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/dashboard">
                <TrendingUp className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/debug">
                <Settings className="h-4 w-4 mr-2" />
                Debug Tools
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Warning for Voting Period */}
      {governanceState && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <Clock className="h-5 w-5" />
              <span className="font-medium">Voting Period Notice</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Voting period is short (~
              {Math.round(governanceState.votingPeriod * 0.4)} seconds on
              localnet). Participants should vote immediately after proposals
              are created to ensure their voice is heard!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
