import { create } from 'zustand';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Import from the local locations inside your UI project
import { OnChain } from '@/lib/programs/on_chain';
import { Governance } from '@/lib/programs/governance';
import idlOnChain from '@/lib/programs/on_chain.json';
import idlGovernance from '@/lib/programs/governance.json';

// Define the structure of your state
interface AppState {
  connection: Connection | null;
  provider: AnchorProvider | null;
  onChainProgram: Program<OnChain> | null;
  governanceProgram: Program<Governance> | null;
  init: (wallet: WalletContextState) => void;
}

// Define the program IDs from your Anchor project
const ON_CHAIN_PROGRAM_ID = new PublicKey('6hPPwfMV5yMR6pCvg1kt2JaAT5FSRjnefuYQ74s62XLL');
const GOVERNANCE_PROGRAM_ID = new PublicKey('HbD9TyCRmTboM3QuL2h227hEhzKBfL3CTgqtohtGKP92');

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state values
  connection: null,
  provider: null,
  onChainProgram: null,
  governanceProgram: null,

  init: (wallet) => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      console.error("Wallet is not fully connected or doesn't support signing.");
      return;
    }

    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // --- FIX APPLIED HERE ---
    // Create a simple wallet object that conforms to what AnchorProvider expects.
    const providerWallet = {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction,
      signAllTransactions: wallet.signAllTransactions,
    };

    const provider = new AnchorProvider(connection, providerWallet as any, {
      preflightCommitment: 'confirmed',
    });

    // Create program instances
    const onChainProgram = new Program<OnChain>(
      idlOnChain as Idl,
      ON_CHAIN_PROGRAM_ID,
      provider
    );
    const governanceProgram = new Program<Governance>(
      idlGovernance as Idl,
      GOVERNANCE_PROGRAM_ID,
      provider
    );

    set({
      connection,
      provider,
      onChainProgram,
      governanceProgram,
    });

    console.log("App store initialized with programs.");
  },
}));
