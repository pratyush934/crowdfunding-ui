"use client";

import { Governance } from "@/lib/programs/governance";
import { useAppStore } from "@/store";
import { IdlAccounts } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { useCallback, useEffect, useState } from "react";

// Map u8 state values to strings based on governance program
const PROPOSAL_STATE_MAP: { [key: number]: string } = {
  0: "voting",
  1: "succeeded",
  2: "executed",
  3: "failed",
};

export type ProposalAccount = IdlAccounts<Governance>["proposal"] & {
  state: string; // Override state as string
  ipfsUrl?: string;
  fileName?: string;
};

interface IPFSData {
  ipfsUrl: string;
  fileName: string;
  timestamp: number;
}

export const useProposals = () => {
  const { governanceProgram } = useAppStore();
  const { connected } = useWallet();
  const [proposals, setProposals] = useState<ProposalAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Helper function to safely get IPFS data from localStorage
  const getIPFSData = useCallback((proposalId: string): IPFSData | null => {
    if (typeof window === "undefined") return null; // SSR safety

    try {
      const ipfsData = localStorage.getItem(`proposal_${proposalId}`);
      if (ipfsData) {
        const parsed = JSON.parse(ipfsData);
        if (
          parsed &&
          typeof parsed.ipfsUrl === "string" &&
          typeof parsed.fileName === "string"
        ) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn(
        `Failed to parse IPFS data for proposal ${proposalId}:`,
        error
      );
    }
    return null;
  }, []);

  const fetchProposals = useCallback(async () => {
    // Only fetch if we have the program and wallet is connected
    if (!governanceProgram || !connected) {
      setProposals([]);
      return;
    }

    console.log("Fetching proposals...");
    setIsLoading(true);
    setError(null);

    try {
      const fetchedAccounts = await governanceProgram.account.proposal.all();
      console.log(`Found ${fetchedAccounts.length} proposal accounts.`);

      const enrichedProposals = fetchedAccounts.map((account) => {
        const proposalId = account.account.id.toString();
        const ipfsData = getIPFSData(proposalId);

        // Get state as number and map to string
        const stateNumber =
          typeof account.account.state === "object"
            ? Object.keys(account.account.state)[0] // Handle enum-like objects
            : account.account.state;

        const stateIndex =
          typeof stateNumber === "string" ? parseInt(stateNumber) : stateNumber;

        return {
          ...account.account,
          state: PROPOSAL_STATE_MAP[stateIndex] || "unknown",
          ipfsUrl: ipfsData?.ipfsUrl,
          fileName: ipfsData?.fileName,
        };
      });

      // Sort proposals: voting first, then by ID descending
      const sortedProposals = enrichedProposals.sort((a, b) => {
        const stateOrder = {
          voting: 0,
          succeeded: 1,
          executed: 2,
          failed: 3,
          unknown: 4,
        };
        const stateComparison =
          (stateOrder[a.state] ?? 4) - (stateOrder[b.state] ?? 4);

        if (stateComparison !== 0) {
          return stateComparison;
        }

        // If states are the same, sort by ID descending (newest first)
        return b.id.toNumber() - a.id.toNumber();
      });

      setProposals(sortedProposals);
      console.log("Finished fetching and sorting proposals.");
    } catch (err: any) {
      console.error("Error fetching proposals:", err);
      setError(err);
      setProposals([]);
    } finally {
      setIsLoading(false);
    }
  }, [governanceProgram, connected, getIPFSData]);

  // Fetch proposals when dependencies change
  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    isLoading,
    error,
    refetch: fetchProposals,
    proposalCount: proposals.length,
  };
};
