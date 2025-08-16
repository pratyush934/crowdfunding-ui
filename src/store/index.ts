"use client";

import { create } from "zustand";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";

// Import from the local locations inside your UI project
import { OnChain } from "@/lib/programs/on_chain";
import { Governance } from "@/lib/programs/governance";

// Import IDLs directly
import onChainIdlRaw from "@/lib/programs/on_chain.json";
import governanceIdlRaw from "@/lib/programs/governance.json";

// --- THE DEFINITIVE FIX IS IN THIS FUNCTION ---
function cleanIdl(rawIdl: any): Idl {
  // 1. Handle the case where the IDL is nested under a `default` property
  const idl = rawIdl.default || rawIdl;

  // 2. Create a new object, spreading all original properties.
  //    Then, explicitly pull the required fields from metadata to the top level.
  const cleanIdl: Idl = {
    ...idl,
    name: idl.metadata?.name || idl.name,
    version: idl.metadata?.version || idl.version,
    address: idl.address || idl.metadata?.address, // Use top-level address if present
  };

  // Enhanced logging for debugging
  console.log(`🧹 Cleaning IDL for "${cleanIdl.name}"`);
  console.log("Raw IDL structure:", {
    hasDefault: !!rawIdl.default,
    hasMetadata: !!idl.metadata,
    hasAddress: !!idl.address,
    hasMetadataAddress: !!idl.metadata?.address,
    name: cleanIdl.name,
    version: cleanIdl.version,
    address: cleanIdl.address,
  });

  // Validate critical fields
  if (!cleanIdl.name) {
    console.warn("⚠️ IDL missing name field");
  }
  if (!cleanIdl.version) {
    console.warn("⚠️ IDL missing version field");
  }
  if (!cleanIdl.address) {
    console.warn("⚠️ IDL missing address field");
  }

  console.log(`✅ IDL for "${cleanIdl.name}" cleaned and validated.`);
  return cleanIdl;
}

// Create clean IDLs at the module level
const idlOnChain = cleanIdl(onChainIdlRaw);
const idlGovernance = cleanIdl(governanceIdlRaw);

// Safety check for address
if (!idlOnChain.address) {
  throw new Error(
    "on_chain.json is missing address field. Please update or redeploy the IDL."
  );
}
if (!idlGovernance.address) {
  throw new Error(
    "governance.json is missing address field. Please update or redeploy the IDL."
  );
}

const ON_CHAIN_PROGRAM_ID = new PublicKey(idlOnChain.address);
const GOVERNANCE_PROGRAM_ID = new PublicKey(idlGovernance.address);

interface AppState {
  connection: Connection | null;
  provider: AnchorProvider | null;
  onChainProgram: Program<OnChain> | null;
  governanceProgram: Program<Governance> | null;
  isInitialized: boolean;
  error: string | null;
  init: (wallet: WalletContextState) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  connection: null,
  provider: null,
  onChainProgram: null,
  governanceProgram: null,
  isInitialized: false,
  error: null,

  init: async (wallet) => {
    if (get().isInitialized) {
      console.log("🏦 Store already initialized, skipping...");
      return;
    }

    try {
      if (!wallet || !wallet.publicKey || !wallet.signTransaction) {
        throw new Error(
          "Wallet is not connected or doesn't support signing transactions"
        );
      }

      console.log(
        `🔗 Initializing connection for wallet: ${wallet.publicKey.toString()}`
      );

      const connection = new Connection("http://127.0.0.1:8899", "confirmed");

      const providerWallet = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      };

      const provider = new AnchorProvider(connection, providerWallet as any, {
        preflightCommitment: "confirmed",
      });

      // Use the original stable approach - let Anchor handle program ID from IDL
      const onChainProgram = new Program<OnChain>(idlOnChain, provider);
      const governanceProgram = new Program<Governance>(
        idlGovernance,
        provider
      );

      // Verify program initialization and IDs match
      console.log(
        `🏦 onChainProgram initialized: ${onChainProgram.programId.toString()}`
      );
      console.log(
        `🏦 Expected ON_CHAIN_PROGRAM_ID: ${ON_CHAIN_PROGRAM_ID.toString()}`
      );
      console.log(
        `🏦 governanceProgram initialized: ${governanceProgram.programId.toString()}`
      );
      console.log(
        `🏦 Expected GOVERNANCE_PROGRAM_ID: ${GOVERNANCE_PROGRAM_ID.toString()}`
      );

      // Additional validation
      if (!onChainProgram.programId.equals(ON_CHAIN_PROGRAM_ID)) {
        console.warn("⚠️ OnChain program ID mismatch!");
      }
      if (!governanceProgram.programId.equals(GOVERNANCE_PROGRAM_ID)) {
        console.warn("⚠️ Governance program ID mismatch!");
      }

      set({
        connection,
        provider,
        onChainProgram,
        governanceProgram,
        isInitialized: true,
        error: null,
      });

      console.log("🎉 Store initialization completed successfully!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Store initialization failed:", errorMessage);
      console.error("Full error:", error);
      set({ error: errorMessage, isInitialized: false });
      throw error;
    }
  },
}));
