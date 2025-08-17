"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/store";
import { PublicKey } from "@solana/web3.js";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import {
  Users,
  FileText,
  Wallet,
  Clock,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface GovernanceState {
  admin: PublicKey;
  votingPeriod: number;
  quorumVotes: number;
  proposalCount: number;
}

interface UserStatus {
  isBondHolder: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  bondAmount?: number;
  bondPurpose?: string;
  bondSector?: string;
}

interface DashboardStats {
  totalProposals: number;
  activeProposals: number;
  completedProposals: number;
  totalBondAmount: number;
  avgBondAmount: number;
  currentSlot: number;
}

export default function Dashboard() {
  const { connected, publicKey } = useWallet();
  const { governanceProgram, onChainProgram, connection } = useAppStore();

  const [governanceState, setGovernanceState] =
    useState<GovernanceState | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus>({
    isBondHolder: false,
    isVerified: false,
    isAdmin: false,
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalProposals: 0,
    activeProposals: 0,
    completedProposals: 0,
    totalBondAmount: 0,
    avgBondAmount: 0,
    currentSlot: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    if (!governanceProgram || !connection) return;

    setIsLoading(true);
    try {
      // Fetch governance state using correct PDA seeds
      const [govState] = PublicKey.findProgramAddressSync(
        [Buffer.from("governance_state")],
        governanceProgram.programId
      );

      let govStateData: GovernanceState | null = null;
      try {
        const state = await governanceProgram.account.governanceState.fetch(
          govState
        );
        govStateData = {
          admin: state.admin,
          votingPeriod: state.votingPeriod.toNumber(),
          quorumVotes: state.quorumVotes.toNumber(),
          proposalCount: state.proposalCount.toNumber(),
        };
        setGovernanceState(govStateData);
      } catch (error) {
        console.error("Error fetching governance state:", error);
        toast.error("Failed to fetch governance state");
      }

      // Fetch user status if wallet is connected
      if (connected && publicKey) {
        const userStatusData = await fetchUserStatus(publicKey, govStateData);
        setUserStatus(userStatusData);
      }

      // Fetch dashboard statistics
      const stats = await fetchDashboardStats();
      setDashboardStats(stats);

      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data", {
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user-specific status
  const fetchUserStatus = async (
    userPublicKey: PublicKey,
    govState: GovernanceState | null
  ): Promise<UserStatus> => {
    const status: UserStatus = {
      isBondHolder: false,
      isVerified: false,
      isAdmin: govState ? govState.admin.equals(userPublicKey) : false,
    };

    // Check verified user status
    try {
      const [verifiedUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verified_user"), userPublicKey.toBuffer()],
        governanceProgram.programId
      );

      try {
        const verifiedUserData =
          await governanceProgram.account.verifiedUser.fetch(verifiedUserPda);
        status.isVerified = verifiedUserData.isVerified;
      } catch (fetchError) {
        // Try manual parsing if fetch fails
        const accountInfo = await connection.getAccountInfo(verifiedUserPda);
        if (accountInfo && accountInfo.data.length >= 41) {
          const isVerified = accountInfo.data[40] === 1;
          status.isVerified = isVerified;
        }
      }
    } catch (error) {
      console.error("Error checking verified user status:", error);
    }

    // Check bond holder status using on-chain program
    if (onChainProgram) {
      try {
        const [bondAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("bond"), userPublicKey.toBuffer()],
          new PublicKey("6ongwoyXhZ119UcadKiAMyJf8adB7J9JwVpUNDD7hD5G")
        );

        const bondAccountInfo = await connection.getAccountInfo(bondAccountPda);
        if (bondAccountInfo) {
          status.isBondHolder = true;

          // Try to fetch bond details if possible
          try {
            const bondData = await onChainProgram.account.bondAccount.fetch(
              bondAccountPda
            );
            status.bondAmount = bondData.bondAmount?.toNumber();
            status.bondPurpose = bondData.purpose;
            status.bondSector = bondData.sector;
          } catch (bondFetchError) {
            console.log("Could not fetch bond details:", bondFetchError);
          }
        }
      } catch (error) {
        console.error("Error checking bond holder status:", error);
      }
    }

    return status;
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async (): Promise<DashboardStats> => {
    const stats: DashboardStats = {
      totalProposals: 0,
      activeProposals: 0,
      completedProposals: 0,
      totalBondAmount: 0,
      avgBondAmount: 0,
      currentSlot: 0,
    };

    try {
      // Get current slot
      stats.currentSlot = await connection.getSlot();

      // Fetch all proposals
      const proposalAccounts = await governanceProgram.account.proposal.all();
      stats.totalProposals = proposalAccounts.length;

      let totalBondAmount = 0;
      let activeCount = 0;
      let completedCount = 0;

      proposalAccounts.forEach(({ account }) => {
        const bondAmount = account.bondAmount?.toNumber() || 0;
        totalBondAmount += bondAmount;

        const state = account.state?.toNumber();
        if (state === 0) {
          // Assuming 0 is active
          activeCount++;
        } else {
          completedCount++;
        }
      });

      stats.totalBondAmount = totalBondAmount;
      stats.activeProposals = activeCount;
      stats.completedProposals = completedCount;
      stats.avgBondAmount =
        stats.totalProposals > 0
          ? Math.round(totalBondAmount / stats.totalProposals)
          : 0;
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }

    return stats;
  };

  // Auto-refresh data
  useEffect(() => {
    fetchDashboardData();

    // Set up interval for auto-refresh
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [governanceProgram, onChainProgram, connection, connected, publicKey]);

  // Render status icon
  const renderStatusIcon = (isActive: boolean, label: string) => {
    if (isActive) {
      return (
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {label}
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Not {label}
        </Badge>
      );
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CrypTrust DAO Dashboard</h1>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button
          onClick={fetchDashboardData}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Connection Status */}
      {!connected && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              <span>
                Please connect your wallet to view personalized dashboard
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Status Card */}
      {connected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Your Account Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Wallet:</span>
              <code className="bg-muted px-2 py-1 rounded text-sm">
                {publicKey?.toString().slice(0, 8)}...
                {publicKey?.toString().slice(-8)}
              </code>
            </div>

            <div className="flex flex-wrap gap-2">
              {renderStatusIcon(userStatus.isVerified, "Verified")}
              {renderStatusIcon(userStatus.isBondHolder, "Bond Holder")}
              {userStatus.isAdmin && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>

            {userStatus.isBondHolder && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h4 className="font-medium text-green-800">Bond Details</h4>
                <div className="text-sm text-green-700 space-y-1">
                  {userStatus.bondAmount && (
                    <p>
                      Amount: {userStatus.bondAmount.toLocaleString()} lamports
                    </p>
                  )}
                  {userStatus.bondSector && (
                    <p>Sector: {userStatus.bondSector}</p>
                  )}
                  {userStatus.bondPurpose && (
                    <p>Purpose: {userStatus.bondPurpose}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {!userStatus.isVerified && (
                <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                  ⚠️ Contact the admin to become a verified user to create
                  proposals.
                </div>
              )}
              {!userStatus.isBondHolder && (
                <div className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                  ⚠️ You need a bond account to vote on proposals.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Governance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Governance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {governanceState ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Proposals</span>
                </div>
                <p className="text-2xl font-bold">
                  {governanceState.proposalCount}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Voting Period</span>
                </div>
                <p className="text-2xl font-bold">
                  {governanceState.votingPeriod}
                </p>
                <p className="text-xs text-muted-foreground">
                  ~{governanceState.votingPeriod * 0.4} seconds (localnet)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Quorum Votes</span>
                </div>
                <p className="text-2xl font-bold">
                  {governanceState.quorumVotes}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Loading governance data...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Proposals
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardStats.activeProposals}
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
                  Completed
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardStats.completedProposals}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Bonds
                </p>
                <p className="text-xl font-bold text-purple-600">
                  {(dashboardStats.totalBondAmount / 1_000_000_000).toFixed(2)}{" "}
                  SOL
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats.totalBondAmount.toLocaleString()} lamports
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Bond
                </p>
                <p className="text-xl font-bold text-orange-600">
                  {(dashboardStats.avgBondAmount / 1_000_000_000).toFixed(4)}{" "}
                  SOL
                </p>
                <p className="text-xs text-muted-foreground">
                  {dashboardStats.avgBondAmount.toLocaleString()} lamports
                </p>
              </div>
              <FileText className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proposal Activity */}
      {dashboardStats.totalProposals > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Proposal Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Proposals</span>
                  <span>
                    {dashboardStats.activeProposals}/
                    {dashboardStats.totalProposals}
                  </span>
                </div>
                <Progress
                  value={
                    (dashboardStats.activeProposals /
                      dashboardStats.totalProposals) *
                    100
                  }
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completed Proposals</span>
                  <span>
                    {dashboardStats.completedProposals}/
                    {dashboardStats.totalProposals}
                  </span>
                </div>
                <Progress
                  value={
                    (dashboardStats.completedProposals /
                      dashboardStats.totalProposals) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p>
                <strong>Current Slot:</strong>{" "}
                {dashboardStats.currentSlot.toLocaleString()}
              </p>
              <p>
                <strong>Network:</strong> Localnet
              </p>
            </div>
            {governanceState && (
              <div>
                <p>
                  <strong>Admin:</strong>{" "}
                  {governanceState.admin.toString().slice(0, 8)}...
                </p>
                <p>
                  <strong>Program ID:</strong>{" "}
                  {governanceProgram?.programId.toString().slice(0, 8)}...
                </p>
              </div>
            )}
          </div>

          {governanceState && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Important:</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Voting period is short (~
                {Math.round(governanceState.votingPeriod * 0.4)} seconds on
                localnet). Vote immediately after creating proposals!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild disabled={!connected || !userStatus.isVerified}>
              <Link href="/create">Create Proposal</Link>
            </Button>

            <Button asChild variant="secondary">
              <Link href="/proposals">View Proposals</Link>
            </Button>

            <Button
              asChild
              variant="outline"
              disabled={!connected || userStatus.isBondHolder}
            >
              <Link href="/bond">Initialize Bond</Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/debug">Debug Accounts</Link>
            </Button>
          </div>

          {connected && (
            <div className="mt-4 text-xs text-muted-foreground">
              {!userStatus.isVerified &&
                "• Get verified by admin to create proposals"}
              {!userStatus.isBondHolder &&
                "• Initialize bond account to participate in voting"}
              {userStatus.isAdmin && "• You have admin privileges"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
