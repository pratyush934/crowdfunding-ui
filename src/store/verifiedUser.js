import { Program, web3 } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { readFile } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadIdl() {
  const idlPath = resolve(__dirname, "../lib/programs/governance.json");
  const idlContent = await readFile(idlPath, "utf8");
  return JSON.parse(idlContent);
}

const connection = new web3.Connection("http://127.0.0.1:8899", "confirmed");
const programId = new PublicKey("ER1NPdo7zrjDbvnyGsfkGwnanHdcUe6B2oVuskgUa5Vz");

(async () => {
  try {
    const idl = await loadIdl();
    const program = new Program(idl, programId, {
      connection,
    });

    async function checkVerifiedUser(pda) {
      try {
        const pdaPublicKey = new PublicKey(pda);
        const account = await program.account.verifiedUser.fetch(pdaPublicKey);
        console.log("Verified User Account:", account);
        const isVerified =
          account.authority.toBase58() ===
          "5nwVYrFN6MRGrGJPrCqaomyBesLxNsiTpdDWPWPPwziX"; // Your public key
        console.log("Is Verified:", isVerified);
        return isVerified;
      } catch (error) {
        console.error("Error fetching verified user account:", error);
        return false;
      }
    }

    const pda = "8soPWm6REuXC89DkCAyb9sBs2m4vJ4ZfZLSURCY8cniw";
    await checkVerifiedUser(pda);
  } catch (error) {
    console.error("Main execution error:", error);
  }
})();
