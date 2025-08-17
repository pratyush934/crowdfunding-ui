"use client";

import { useAppStore } from "@/store";
import { BN } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  File,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Wallet,
  Info,
} from "lucide-react";
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
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({
    description: "",
    bondPurpose: "",
    bondSector: "",
    bondAmount: "",
    file: "",
  });

  // Predefined sectors for multi-domain support
  const sectors = [
    {
      value: "Healthcare",
      label: "🏥 Healthcare",
      color: "bg-red-50 text-red-700",
    },
    {
      value: "Education",
      label: "🎓 Education",
      color: "bg-blue-50 text-blue-700",
    },
    {
      value: "Disaster Relief",
      label: "🚨 Disaster Relief",
      color: "bg-orange-50 text-orange-700",
    },
    {
      value: "Electoral Funding",
      label: "🗳️ Electoral Funding",
      color: "bg-purple-50 text-purple-700",
    },
    {
      value: "Infrastructure",
      label: "🏗️ Infrastructure",
      color: "bg-gray-50 text-gray-700",
    },
    {
      value: "Social Welfare",
      label: "🤝 Social Welfare",
      color: "bg-green-50 text-green-700",
    },
    {
      value: "Public Finance",
      label: "💰 Public Finance",
      color: "bg-yellow-50 text-yellow-700",
    },
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

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(selectedFile.type)) {
      setErrors((prev) => ({
        ...prev,
        file: "Please upload a JPEG, PNG, or PDF file.",
      }));
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (selectedFile.size > maxSize) {
      setErrors((prev) => ({
        ...prev,
        file: "File size must be less than 5MB.",
      }));
      return;
    }

    setFileUploading(true);
    setUploadProgress(0);
    setErrors((prev) => ({ ...prev, file: "" }));

    try {
      const data = new FormData();
      data.set("file", selectedFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const uploadRequest = await fetch("/api/files", {
        method: "POST",
        body: data,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadRequest.ok) {
        throw new Error(
          `Upload failed: ${uploadRequest.status} ${uploadRequest.statusText}`
        );
      }

      const signedUrl = await uploadRequest.json();

      // Use the response directly as in the original code
      setIpfsUrl(signedUrl);
      setFileName(selectedFile.name);
      setFile(selectedFile);
      toast.success("File uploaded successfully!");
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrors((prev) => ({ ...prev, file: "Upload failed: " + err.message }));
    } finally {
      setFileUploading(false);
      setUploadProgress(0);
    }
  };

  const createProposalBuffer = (proposalId: number | string | BN): Buffer => {
    const idNumber =
      typeof proposalId === "object"
        ? proposalId.toNumber()
        : Number(proposalId);
    const buffer = Buffer.alloc(8);
    const view = new DataView(buffer.buffer);
    view.setBigUint64(0, BigInt(idNumber), true);
    return buffer;
  };

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
      const [verifiedUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verified_user"), publicKey.toBuffer()],
        governanceProgram.programId
      );

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

      const [govState] = PublicKey.findProgramAddressSync(
        [Buffer.from("governance_state")],
        governanceProgram.programId
      );

      const governanceState =
        await governanceProgram.account.governanceState.fetch(govState);
      const proposalCount = governanceState.proposalCount;

      const proposalBuffer = createProposalBuffer(proposalCount);
      const [proposalPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("proposal"), proposalBuffer],
        governanceProgram.programId
      );

      const currentSlot = await governanceProgram.provider.connection.getSlot();
      const votingPeriod = 100000;
      const endSlot = new BN(currentSlot + votingPeriod);

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

      router.push("/proposals");
    } catch (err: any) {
      console.error("Error submitting proposal:", err);

      let errorMessage = "Failed to submit proposal.";
      let errorDescription = err.message || "An unknown error occurred.";

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

  const selectedSector = sectors.find((sector) => sector.value === bondSector);
  const solAmount = bondAmount
    ? (Number(bondAmount) / 1000000000).toFixed(4)
    : "0";

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Create New Proposal
        </h1>
        <p className="text-muted-foreground">
          Submit a bond issuance proposal for community voting
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <File className="h-5 w-5" />
                Proposal Details
              </CardTitle>
              <CardDescription>
                Complete all required fields to submit your proposal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Proposal Description *
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a comprehensive description of your proposal, including objectives, timeline, and expected outcomes..."
                    className={`min-h-[120px] resize-none ${
                      errors.description
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{description.length} characters (min. 10)</span>
                    {errors.description && (
                      <span className="text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bond Purpose */}
                <div className="space-y-2">
                  <Label htmlFor="bondPurpose" className="text-sm font-medium">
                    Bond Purpose *
                  </Label>
                  <Input
                    id="bondPurpose"
                    value={bondPurpose}
                    onChange={(e) => setBondPurpose(e.target.value)}
                    placeholder="e.g., Construction of community health center"
                    className={
                      errors.bondPurpose
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {errors.bondPurpose && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.bondPurpose}
                    </p>
                  )}
                </div>

                {/* Bond Sector */}
                <div className="space-y-2">
                  <Label htmlFor="bondSector" className="text-sm font-medium">
                    Bond Sector *
                  </Label>
                  <Select value={bondSector} onValueChange={setBondSector}>
                    <SelectTrigger
                      id="bondSector"
                      className={
                        errors.bondSector
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }
                    >
                      <SelectValue placeholder="Choose the relevant sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map((sector) => (
                        <SelectItem key={sector.value} value={sector.value}>
                          <div className="flex items-center gap-2">
                            <span>{sector.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedSector && (
                    <Badge variant="outline" className={selectedSector.color}>
                      {selectedSector.label}
                    </Badge>
                  )}
                  {errors.bondSector && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.bondSector}
                    </p>
                  )}
                </div>

                {/* Bond Amount */}
                <div className="space-y-2">
                  <Label htmlFor="bondAmount" className="text-sm font-medium">
                    Bond Amount *
                  </Label>
                  <div className="relative">
                    <Input
                      id="bondAmount"
                      type="number"
                      value={bondAmount}
                      onChange={(e) => setBondAmount(e.target.value)}
                      placeholder="1000000000"
                      className={`pr-20 ${
                        errors.bondAmount
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      lamports
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>≈ {solAmount} SOL</span>
                    <span>1 SOL = 1,000,000,000 lamports</span>
                  </div>
                  {errors.bondAmount && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.bondAmount}
                    </p>
                  )}
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="proofFile" className="text-sm font-medium">
                    Proof of Intent *
                  </Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 transition-colors hover:border-primary/50">
                    {!ipfsUrl ? (
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            Upload supporting document
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPEG, PNG, or PDF up to 5MB
                          </p>
                        </div>
                        <Input
                          id="proofFile"
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          onChange={handleFileUpload}
                          disabled={fileUploading}
                          className="mt-2"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-8 w-8 text-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {fileName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Uploaded to IPFS
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-xs text-primary hover:underline"
                              onClick={() => window.open(ipfsUrl, "_blank")}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View File
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {fileUploading && (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading to IPFS...
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                  {errors.file && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.file}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={
                    !connected || isLoading || fileUploading || !ipfsUrl
                  }
                  className="w-full h-11 font-medium"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Proposal...
                    </div>
                  ) : (
                    "Submit Proposal"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Wallet Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {connected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">
                      Connected
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {publicKey?.toString().slice(0, 8)}...
                    {publicKey?.toString().slice(-8)}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-600 font-medium">
                      Not Connected
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Please connect your wallet to continue
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-4 w-4" />
                Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Verified wallet address</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Complete proposal description</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Supporting documentation</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>Valid bond amount</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Need help? Contact the administrator for wallet verification or
              technical support.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
