// const { PublicKey } = require("@solana/web3.js");
import {PublicKey} from "@solana/web3.js"

// Governance program ID
const GOVERNANCE_PROGRAM_ID = new PublicKey("ER1NPdo7zrjDbvnyGsfkGwnanHdcUe6B2oVuskgUa5Vz");

// Function to create buffer from proposal ID
function createProposalIdBuffer(proposalId) {
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64LE(BigInt(proposalId), 0);
  return buffer;
}

// Derive PDA for proposalId (try 0, 1, etc.)
const proposalId = 5; // Adjust based on your proposal count
const proposalBuffer = createProposalIdBuffer(proposalId);
const [proposalPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("proposal"), proposalBuffer],
  GOVERNANCE_PROGRAM_ID
);

console.log("Proposal PDA:", proposalPda.toString());