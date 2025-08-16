import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export interface ProposalAccount {
  publicKey: PublicKey;
  id: BN;
  proposer: PublicKey;
  description: string;
  yesVotes: BN;
  noVotes: BN;
  startSlot: BN;
  endSlot: BN;
  state: any;
  bondPurpose: string;
  bondSector: string;
  bondAmount: BN;
  ipfsUrl?: string;
  fileName?: string;
}

interface IPFSData {
  ipfsUrl: string;
  fileName: string;
  timestamp: number;
}

export const useProposals = () => {
  const { governanceProgram } = useAppStore();
  const [proposals, setProposals] = useState<ProposalAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Helper function to safely get IPFS data from localStorage
  const getIPFSData = (proposalId: string): IPFSData | null => {
    try {
      const ipfsData = localStorage.getItem(`proposal_${proposalId}`);
      if (ipfsData) {
        const parsed = JSON.parse(ipfsData);
        // Validate the parsed data structure
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
  };

  // Helper function to sort proposals (newest first, then by state priority)
  const sortProposals = (proposals: ProposalAccount[]): ProposalAccount[] => {
    const stateOrder = { voting: 0, succeeded: 1, executed: 2, failed: 3 };

    return proposals.sort((a, b) => {
      const aState = Object.keys(a.state)[0] as keyof typeof stateOrder;
      const bState = Object.keys(b.state)[0] as keyof typeof stateOrder;

      // First sort by state priority
      const stateComparison =
        (stateOrder[aState] ?? 4) - (stateOrder[bState] ?? 4);
      if (stateComparison !== 0) {
        return stateComparison;
      }

      // Then sort by ID (newest first)
      return b.id.cmp(a.id);
    });
  };

  const fetchProposals = useCallback(async () => {
    if (!governanceProgram) {
      setProposals([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log("Fetching proposals...");

    try {
      const proposalAccounts = await governanceProgram.account.proposal.all();
      console.log(`Found ${proposalAccounts.length} proposal accounts.`);

      const enrichedProposals = proposalAccounts.map((account) => {
        const proposalId = account.account.id.toString();
        const ipfsData = getIPFSData(proposalId);

        return {
          publicKey: account.publicKey,
          id: account.account.id,
          proposer: account.account.proposer,
          description: account.account.description,
          yesVotes: account.account.yesVotes,
          noVotes: account.account.noVotes,
          startSlot: account.account.startSlot,
          endSlot: account.account.endSlot,
          state: account.account.state,
          bondPurpose: account.account.bondPurpose,
          bondSector: account.account.bondSector,
          bondAmount: account.account.bondAmount,
          ipfsUrl: ipfsData?.ipfsUrl,
          fileName: ipfsData?.fileName,
        };
      });

      const sortedProposals = sortProposals(enrichedProposals);
      setProposals(sortedProposals);
      console.log("Finished fetching and sorting proposals.");
    } catch (err: any) {
      console.error("Error fetching proposals:", err);
      setError(err);
      setProposals([]); // Clear proposals on error
    } finally {
      setIsLoading(false);
    }
  }, [governanceProgram]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Return refresh function for manual updates
  const refreshProposals = useCallback(() => {
    fetchProposals();
  }, [fetchProposals]);

  return {
    proposals,
    isLoading,
    error,
    refreshProposals,
    proposalCount: proposals.length,
  };
};
