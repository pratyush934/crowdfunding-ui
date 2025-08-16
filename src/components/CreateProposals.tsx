"use client";

import { useAppStore } from "@/store";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { File } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { pinata } from "../../utils/config";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

export function CreateProposalForm() {
  const { connected, publicKey } = useWallet();
  const { governanceProgram } = useAppStore();
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [bondPurpose, setBondPurpose] = useState("");
  const [bondSector, setBondSector] = useState("");
  const [bondAmount, setBondAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [ipfsUrl, setIpfsUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [errors, setErrors] = useState({
    description: "",
    bondPurpose: "",
    bondSector: "",
    bondAmount: "",
    file: "",
  });

  // Predefined sectors for multi-domain support
  const sectors = [
    "Healthcare",
    "Education",
    "Disaster Relief",
    "Electoral Funding",
    "Infrastructure",
    "Social Welfare",
    "Public Finance",
  ];

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      description: "",
      bondPurpose: "",
      bondSector: "",
      bondAmount: "",
      file: "",
    };

    if (!description || description.length < 10) {
      newErrors.description =
        "Description must be at least 10 characters long.";
      isValid = false;
    }
    if (!bondPurpose || bondPurpose.length < 5) {
      newErrors.bondPurpose =
        "Bond purpose must be at least 5 characters long.";
      isValid = false;
    }
    if (!bondSector) {
      newErrors.bondSector = "Please select a bond sector.";
      isValid = false;
    }
    if (!bondAmount || isNaN(Number(bondAmount)) || Number(bondAmount) <= 0) {
      newErrors.bondAmount = "Please enter a valid bond amount.";
      isValid = false;
    }
    if (!ipfsUrl) {
      newErrors.file = "Please upload a proof of intent file.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFileUploading(true);

    try {
      const data = new FormData();
      data.set("file", selectedFile);

      const uploadRequest = await fetch("/api/files", {
        method: "POST",
        body: data,
      });

      if (!uploadRequest.ok) {
        throw new Error(`HTTP error! status: ${uploadRequest.status}`);
      }

      const signedUrl = await uploadRequest.json();
      setIpfsUrl(signedUrl); // Assuming this is the direct IPFS URL
      setFileName(selectedFile.name);
      toast.success("File uploaded successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrors((prev) => ({ ...prev, file: "Upload failed: " + err.message }));
    } finally {
      setFileUploading(false);
    }
  };

  // Modification: Add createProposalBuffer to handle u64 buffer creation
  // Reason: Buffer.writeBigUInt64LE is not available in browser environments
  // New approach: Use DataView to write u64 in little-endian format
  const createProposalBuffer = (proposalId: number | string | BN): Buffer => {
    const idNumber =
      typeof proposalId === "object"
        ? proposalId.toNumber()
        : Number(proposalId);
    const buffer = Buffer.alloc(8);
    const view = new DataView(buffer.buffer);
    view.setBigUint64(0, BigInt(idNumber), true); // true for little-endian
    return buffer;
  };

  // Enhanced handleSubmit function with verification check

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey || !governanceProgram) {
      toast.error(
        "Please connect your wallet and ensure the program is initialized."
      );
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Checking verification status...");

    try {
      // First, check if the user is verified
      const [verifiedUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verified_user"), publicKey.toBuffer()],
        governanceProgram.programId // Use governance program ID, not onchain program ID
      );

      // Check if verified user account exists
      const verifiedUserAccount =
        await governanceProgram.provider.connection.getAccountInfo(
          verifiedUserPda
        );

      if (!verifiedUserAccount) {
        toast.error("User verification required", {
          id: toastId,
          description:
            "Your wallet needs to be verified by an admin before you can create proposals. Please contact the administrator.",
        });
        return;
      }

      // Try to fetch the verified user data to ensure it's properly initialized
      try {
        const verifiedUserData =
          await governanceProgram.account.verifiedUser.fetch(verifiedUserPda);
        if (!verifiedUserData.isVerified) {
          toast.error("User not verified", {
            id: toastId,
            description:
              "Your account exists but is not marked as verified. Please contact the administrator.",
          });
          return;
        }
      } catch (fetchError) {
        console.error("Error fetching verified user data:", fetchError);
        toast.error("Verification check failed", {
          id: toastId,
          description:
            "Unable to verify user status. Please try again or contact support.",
        });
        return;
      }

      toast.loading("Submitting proposal...", { id: toastId });

      // Fetch governance state to get proposal count
      const [govState] = PublicKey.findProgramAddressSync(
        [Buffer.from("governance_state")],
        governanceProgram.programId
      );

      const governanceState =
        await governanceProgram.account.governanceState.fetch(govState);
      const proposalCount = governanceState.proposalCount;

      // Create proposal ID buffer
      const proposalBuffer = createProposalBuffer(proposalCount);
      const [proposalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalBuffer],
        governanceProgram.programId
      );

      const currentSlot = await governanceProgram.provider.connection.getSlot();
      const votingPeriod = 100000; // ~400 seconds on localnet
      const endSlot = new BN(currentSlot + votingPeriod);

      // Create the proposal
      const tx = await governanceProgram.methods
        .createProposal(
          description,
          bondPurpose,
          bondSector,
          new BN(bondAmount)
        )
        .accounts({
          governanceState: govState,
          proposal: proposalPda,
          proposer: publicKey,
          verifiedUser: verifiedUserPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Store IPFS data in localStorage
      const ipfsData = {
        ipfsUrl,
        fileName,
        timestamp: Date.now(),
      };
      localStorage.setItem(
        `proposal_${proposalCount.toString()}`,
        JSON.stringify(ipfsData)
      );

      toast.success("Proposal created successfully!", {
        id: toastId,
        description: (
          <div>
            <p>Transaction: {tx}</p>
            <p>Proposal PDA: {proposalPda.toString()}</p>
          </div>
        ),
      });

      // Reset form
      setDescription("");
      setBondPurpose("");
      setBondSector("");
      setBondAmount("");
      setFile(null);
      setIpfsUrl("");
      setFileName("");

      // Redirect to proposals page
      router.push("/proposals");
    } catch (err: any) {
      console.error("Error submitting proposal:", err);

      let errorMessage = "Failed to submit proposal.";
      let errorDescription = err.message || "An unknown error occurred.";

      // Provide specific error messages based on the error
      if (err.message?.includes("AccountNotInitialized")) {
        errorMessage = "User verification required";
        errorDescription =
          "Your wallet needs to be verified by an admin before you can create proposals. Please contact the administrator.";
      } else if (err.message?.includes("UserNotVerified")) {
        errorMessage = "User not verified";
        errorDescription =
          "Your account is not marked as verified. Please contact the administrator.";
      }

      toast.error(errorMessage, {
        id: toastId,
        description: errorDescription,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create a New Proposal</CardTitle>
        <CardDescription>
          Submit a proposal for bond issuance to be voted on by bond holders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Proposal Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose and details of your proposal..."
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bondPurpose">Bond Purpose</Label>
            <Input
              id="bondPurpose"
              value={bondPurpose}
              onChange={(e) => setBondPurpose(e.target.value)}
              placeholder="E.g., Building a new public park"
              className={errors.bondPurpose ? "border-red-500" : ""}
            />
            {errors.bondPurpose && (
              <p className="text-sm text-red-500">{errors.bondPurpose}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bondSector">Bond Sector</Label>
            <Select value={bondSector} onValueChange={setBondSector}>
              <SelectTrigger
                id="bondSector"
                className={errors.bondSector ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Select a sector" />
              </SelectTrigger>
              <SelectContent>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bondSector && (
              <p className="text-sm text-red-500">{errors.bondSector}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bondAmount">Bond Amount (lamports)</Label>
            <Input
              id="bondAmount"
              type="number"
              value={bondAmount}
              onChange={(e) => setBondAmount(e.target.value)}
              placeholder="Enter amount in lamports"
              className={errors.bondAmount ? "border-red-500" : ""}
            />
            {errors.bondAmount && (
              <p className="text-sm text-red-500">{errors.bondAmount}</p>
            )}
            <p className="text-xs text-muted-foreground">
              1 SOL = 1,000,000,000 lamports
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="proofFile">
              Proof of Intent (JPEG, PNG, or PDF)
            </Label>
            <Input
              id="proofFile"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileUpload}
              disabled={fileUploading}
              className={errors.file ? "border-red-500" : ""}
            />
            {fileUploading && (
              <div className="flex items-center gap-2 text-sm text-blue-500">
                <div className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                Uploading file to IPFS...
              </div>
            )}
            {ipfsUrl && !errors.file && (
              <div className="text-sm text-green-500 flex items-center gap-2">
                <File className="h-4 w-4" />
                <span>Uploaded: {fileName}</span>
                <a
                  href={ipfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on IPFS
                </a>
              </div>
            )}
            {errors.file && (
              <p className="text-sm text-red-500">{errors.file}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!connected || isLoading || fileUploading || !ipfsUrl}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </div>
            ) : (
              "Submit Proposal"
            )}
          </Button>

          {!connected && (
            <p className="text-sm text-muted-foreground text-center">
              Please connect your wallet to submit a proposal.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
