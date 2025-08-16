'use client'

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/store";
import { PublicKey } from "@solana/web3.js";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { toast } from "sonner";
import {
  Bug,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export function DebugAccountChecker() {
  const { connected, publicKey } = useWallet();
  const { governanceProgram } = useAppStore();
  const [isChecking, setIsChecking] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkAllAccounts = async () => {
    if (!connected || !publicKey || !governanceProgram) {
      toast.error("Please connect your wallet.");
      return;
    }

    setIsChecking(true);
    const info: any = {
      walletAddress: publicKey.toString(),
      timestamp: new Date().toISOString(),
    };

    try {
      // Check governance state
      const [govState] = PublicKey.findProgramAddressSync(
        [Buffer.from("governance_state")],
        governanceProgram.programId
      );

      info.governanceState = {
        pda: govState.toString(),
        exists: false,
        data: null,
      };

      try {
        const govStateAccount =
          await governanceProgram.provider.connection.getAccountInfo(govState);
        if (govStateAccount) {
          info.governanceState.exists = true;
          try {
            const govStateData =
              await governanceProgram.account.governanceState.fetch(govState);
            info.governanceState.data = {
              admin: govStateData.admin.toString(),
              votingPeriod: govStateData.votingPeriod.toString(),
              quorumVotes: govStateData.quorumVotes.toString(),
              proposalCount: govStateData.proposalCount.toString(),
              isCurrentUserAdmin: govStateData.admin.equals(publicKey),
            };
          } catch (fetchError) {
            info.governanceState.fetchError = fetchError.message;
          }
        }
      } catch (error) {
        info.governanceState.error = error.message;
      }

      // Check verified user account
      const [verifiedUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verified_user"), publicKey.toBuffer()],
        governanceProgram.programId
      );

      info.verifiedUser = {
        pda: verifiedUserPda.toString(),
        exists: false,
        data: null,
      };

      try {
        const verifiedUserAccount =
          await governanceProgram.provider.connection.getAccountInfo(
            verifiedUserPda
          );
        if (verifiedUserAccount) {
          info.verifiedUser.exists = true;
          info.verifiedUser.rawData = {
            lamports: verifiedUserAccount.lamports,
            owner: verifiedUserAccount.owner.toString(),
            executable: verifiedUserAccount.executable,
            rentEpoch: verifiedUserAccount.rentEpoch.toString(),
            dataLength: verifiedUserAccount.data.length,
            dataHex: verifiedUserAccount.data.toString("hex"),
          };

          try {
            const verifiedUserData =
              await governanceProgram.account.verifiedUser.fetch(
                verifiedUserPda
              );
            info.verifiedUser.data = {
              authority: verifiedUserData.authority.toString(),
              isVerified: verifiedUserData.isVerified,
            };
          } catch (fetchError) {
            info.verifiedUser.fetchError = fetchError.message;

            // Try to parse manually
            try {
              const data = verifiedUserAccount.data;
              if (data.length >= 33) {
                const authority = new PublicKey(data.slice(8, 40));
                const isVerified = data[40] === 1;
                info.verifiedUser.manualParse = {
                  authority: authority.toString(),
                  isVerified: isVerified,
                };
              }
            } catch (parseError) {
              info.verifiedUser.manualParseError = parseError.message;
            }
          }
        }
      } catch (error) {
        info.verifiedUser.error = error.message;
      }

      // Check bond account (from on-chain program)
      const [bondAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bond"), publicKey.toBuffer()],
        new PublicKey("6ongwoyXhZ119UcadKiAMyJf8adB7J9JwVpUNDD7hD5G")
      );

      info.bondAccount = {
        pda: bondAccountPda.toString(),
        exists: false,
        data: null,
      };

      try {
        const bondAccount =
          await governanceProgram.provider.connection.getAccountInfo(
            bondAccountPda
          );
        if (bondAccount) {
          info.bondAccount.exists = true;
          info.bondAccount.rawData = {
            lamports: bondAccount.lamports,
            owner: bondAccount.owner.toString(),
            executable: bondAccount.executable,
            rentEpoch: bondAccount.rentEpoch.toString(),
            dataLength: bondAccount.data.length,
          };
        }
      } catch (error) {
        info.bondAccount.error = error.message;
      }

      // Get current slot for debugging voting periods
      try {
        const currentSlot =
          await governanceProgram.provider.connection.getSlot();
        info.currentSlot = currentSlot;
      } catch (error) {
        info.currentSlotError = error.message;
      }

      setDebugInfo(info);
      toast.success("Account check completed!");
    } catch (error: any) {
      console.error("Debug check error:", error);
      info.globalError = error.message;
      setDebugInfo(info);
      toast.error("Debug check failed", {
        description: error.message,
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey && governanceProgram) {
      checkAllAccounts();
    }
  }, [connected, publicKey, governanceProgram]);

  const renderStatus = (exists: boolean, data: any, error?: string) => {
    if (error) {
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-4 w-4" />
          <span>Error</span>
        </div>
      );
    }

    if (exists && data) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Valid</span>
        </div>
      );
    }

    if (exists && !data) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span>Exists but unparseable</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-gray-600">
        <XCircle className="h-4 w-4" />
        <span>Not found</span>
      </div>
    );
  };

  if (!connected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug Account Checker
          </CardTitle>
          <CardDescription>
            Please connect your wallet to debug account states.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug Account Checker
        </CardTitle>
        <CardDescription>
          Check the status of all governance-related accounts for debugging.
        </CardDescription>
        <Button
          onClick={checkAllAccounts}
          disabled={isChecking}
          className="w-fit"
        >
          {isChecking ? (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Checking...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh Check
            </div>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {debugInfo && (
          <div className="space-y-6">
            {/* Governance State */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Governance State</h3>
                {renderStatus(
                  debugInfo.governanceState?.exists,
                  debugInfo.governanceState?.data,
                  debugInfo.governanceState?.error
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>PDA:</strong> {debugInfo.governanceState?.pda}
                  </p>
                  <p>
                    <strong>Exists:</strong>{" "}
                    {debugInfo.governanceState?.exists ? "Yes" : "No"}
                  </p>
                </div>
                {debugInfo.governanceState?.data && (
                  <div>
                    <p>
                      <strong>Admin:</strong>{" "}
                      {debugInfo.governanceState.data.admin}
                    </p>
                    <p>
                      <strong>Is Current User Admin:</strong>{" "}
                      {debugInfo.governanceState.data.isCurrentUserAdmin
                        ? "Yes"
                        : "No"}
                    </p>
                    <p>
                      <strong>Proposal Count:</strong>{" "}
                      {debugInfo.governanceState.data.proposalCount}
                    </p>
                    <p>
                      <strong>Voting Period:</strong>{" "}
                      {debugInfo.governanceState.data.votingPeriod}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Verified User */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Verified User Account</h3>
                {renderStatus(
                  debugInfo.verifiedUser?.exists,
                  debugInfo.verifiedUser?.data,
                  debugInfo.verifiedUser?.error
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>PDA:</strong> {debugInfo.verifiedUser?.pda}
                  </p>
                  <p>
                    <strong>Exists:</strong>{" "}
                    {debugInfo.verifiedUser?.exists ? "Yes" : "No"}
                  </p>
                </div>
                {debugInfo.verifiedUser?.data && (
                  <div>
                    <p>
                      <strong>Authority:</strong>{" "}
                      {debugInfo.verifiedUser.data.authority}
                    </p>
                    <p>
                      <strong>Is Verified:</strong>{" "}
                      {debugInfo.verifiedUser.data.isVerified ? "Yes" : "No"}
                    </p>
                  </div>
                )}
                {debugInfo.verifiedUser?.manualParse && (
                  <div className="md:col-span-2 bg-yellow-50 p-2 rounded">
                    <p className="font-medium text-yellow-800">
                      Manual Parse (account exists but fetch failed):
                    </p>
                    <p>
                      <strong>Authority:</strong>{" "}
                      {debugInfo.verifiedUser.manualParse.authority}
                    </p>
                    <p>
                      <strong>Is Verified:</strong>{" "}
                      {debugInfo.verifiedUser.manualParse.isVerified
                        ? "Yes"
                        : "No"}
                    </p>
                  </div>
                )}
                {debugInfo.verifiedUser?.rawData && (
                  <div className="md:col-span-2 bg-gray-50 p-2 rounded">
                    <p className="font-medium">Raw Data:</p>
                    <p>
                      <strong>Data Length:</strong>{" "}
                      {debugInfo.verifiedUser.rawData.dataLength} bytes
                    </p>
                    <p>
                      <strong>Owner:</strong>{" "}
                      {debugInfo.verifiedUser.rawData.owner}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bond Account */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Bond Account</h3>
                {renderStatus(
                  debugInfo.bondAccount?.exists,
                  debugInfo.bondAccount?.data,
                  debugInfo.bondAccount?.error
                )}
              </div>
              <div className="text-sm">
                <p>
                  <strong>PDA:</strong> {debugInfo.bondAccount?.pda}
                </p>
                <p>
                  <strong>Exists:</strong>{" "}
                  {debugInfo.bondAccount?.exists ? "Yes" : "No"}
                </p>
                {debugInfo.bondAccount?.rawData && (
                  <p>
                    <strong>Owner:</strong>{" "}
                    {debugInfo.bondAccount.rawData.owner}
                  </p>
                )}
              </div>
            </div>

            {/* Current Status */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-3">Current Status</h3>
              <div className="text-sm space-y-1">
                <p>
                  <strong>Current Slot:</strong>{" "}
                  {debugInfo.currentSlot || "Unknown"}
                </p>
                <p>
                  <strong>Wallet:</strong> {debugInfo.walletAddress}
                </p>
                <p>
                  <strong>Can Create Proposals:</strong>{" "}
                  {debugInfo.verifiedUser?.exists &&
                  (debugInfo.verifiedUser?.data?.isVerified ||
                    debugInfo.verifiedUser?.manualParse?.isVerified)
                    ? "Yes"
                    : "No - User not verified"}
                </p>
                <p>
                  <strong>Can Vote:</strong>{" "}
                  {debugInfo.bondAccount?.exists
                    ? "Yes"
                    : "No - No bond account"}
                </p>
              </div>
            </div>

            {/* Full Debug JSON */}
            <details className="border rounded-lg p-4">
              <summary className="font-semibold cursor-pointer">
                Full Debug Data (Click to expand)
              </summary>
              <pre className="mt-3 text-xs overflow-x-auto bg-gray-100 p-3 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
