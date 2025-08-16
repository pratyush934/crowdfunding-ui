"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export function InitializeBondForm() {
  const { connected, publicKey } = useWallet();
  const { onChainProgram, connection } = useAppStore();
  const [purpose, setPurpose] = useState("");
  const [sector, setSector] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [bondExists, setBondExists] = useState<boolean | null>(null);
  const [errors, setErrors] = useState({
    purpose: "",
    sector: "",
    amount: "",
  });

  // Predefined sectors (same as CreateProposals.tsx)
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
    const newErrors = { purpose: "", sector: "", amount: "" };

    if (!purpose || purpose.length < 5) {
      newErrors.purpose = "Purpose must be at least 5 characters long.";
      isValid = false;
    }
    if (!sector) {
      newErrors.sector = "Please select a sector.";
      isValid = false;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Please enter a valid positive amount in lamports.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Check if bond account already exists
  const checkBondExists = async () => {
    if (!connected || !publicKey || !connection) return;

    setIsChecking(true);
    try {
      const [bondAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bond"), publicKey.toBuffer()],
        new PublicKey("6ongwoyXhZ119UcadKiAMyJf8adB7J9JwVpUNDD7hD5G")
      );

      const accountInfo = await connection.getAccountInfo(bondAccountPda);
      const exists = accountInfo !== null;
      setBondExists(exists);

      if (exists) {
        toast.info("Bond account already exists for this wallet.", {
          description: `PDA: ${bondAccountPda.toString()}`,
        });
      }
    } catch (error) {
      console.error("Error checking bond account:", error);
      setBondExists(null);
    } finally {
      setIsChecking(false);
    }
  };

  // Check bond existence when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      checkBondExists();
    } else {
      setBondExists(null);
    }
  }, [connected, publicKey, connection]);

  // Function to close/reset existing bond account (if your program supports it)
  const handleResetBond = async () => {
    if (!connected || !publicKey || !onChainProgram) return;

    const confirmReset = window.confirm(
      "Are you sure you want to reset your existing bond account? This action cannot be undone."
    );

    if (!confirmReset) return;

    setIsLoading(true);
    const toastId = toast.loading("Resetting bond account...");

    try {
      const [bondAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bond"), publicKey.toBuffer()],
        new PublicKey("6ongwoyXhZ119UcadKiAMyJf8adB7J9JwVpUNDD7hD5G")
      );

      // If your program has a close_bond method, use it
      // Otherwise, this will need to be handled differently
      await onChainProgram.methods
        .closeBond() // Assuming you have this method
        .accounts({
          bondAccount: bondAccountPda,
          issuer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Bond account reset successfully!", { id: toastId });
      setBondExists(false);
    } catch (error: any) {
      console.error("Error resetting bond:", error);
      toast.error("Failed to reset bond account.", {
        id: toastId,
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!connected || !publicKey || !onChainProgram) {
      toast.error(
        "Please connect your wallet and ensure the program is initialized."
      );
      return;
    }

    if (bondExists) {
      toast.error(
        "Bond account already exists for this wallet. Please use a different wallet or reset the existing bond."
      );
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Initializing bond account...");

    try {
      const [bondAccountPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bond"), publicKey.toBuffer()],
        new PublicKey("6ongwoyXhZ119UcadKiAMyJf8adB7J9JwVpUNDD7hD5G")
      );

      const bondAmount = new BN(amount);

      // Double-check if account exists before trying to create
      const accountInfo = await connection.getAccountInfo(bondAccountPda);
      if (accountInfo !== null) {
        throw new Error("Bond account already exists for this wallet");
      }

      const tx = await onChainProgram.methods
        .initializeBond(purpose, sector, bondAmount)
        .accounts({
          bondAccount: bondAccountPda,
          issuer: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("Bond account initialized successfully!", {
        id: toastId,
        description: `Transaction: ${tx}`,
      });

      // Reset form and update state
      setPurpose("");
      setSector("");
      setAmount("");
      setBondExists(true);
    } catch (err: any) {
      console.error("Error initializing bond:", err);

      // Provide specific error messages
      let errorMessage = "Failed to initialize bond.";
      if (err.message?.includes("already in use")) {
        errorMessage = "Bond account already exists for this wallet.";
        setBondExists(true);
      } else if (err.message?.includes("insufficient funds")) {
        errorMessage = "Insufficient funds to create bond account.";
      }

      toast.error(errorMessage, {
        id: toastId,
        description: err.message || "An unknown error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!connected) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Initialize Bond Account</CardTitle>
          <CardDescription>
            Please connect your wallet to initialize a bond account.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Initialize Bond Account</CardTitle>
        <CardDescription>
          Create a bond account to become a bond holder and participate in DAO
          voting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Bond Status Display */}
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Bond Account Status</h3>
              <p className="text-sm text-muted-foreground">
                {isChecking
                  ? "Checking..."
                  : bondExists === true
                  ? "✅ Bond account exists"
                  : bondExists === false
                  ? "❌ No bond account found"
                  : "Connect wallet to check status"}
              </p>
            </div>
            {bondExists && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetBond}
                disabled={isLoading}
              >
                Reset Bond
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={checkBondExists}
              disabled={isChecking || !connected}
            >
              {isChecking ? "Checking..." : "Refresh"}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="purpose">Bond Purpose</Label>
            <Input
              id="purpose"
              placeholder="e.g., Crowdfunding Bond"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              disabled={bondExists === true}
            />
            {errors.purpose && (
              <p className="text-sm text-red-500">{errors.purpose}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Bond Sector</Label>
            <Select
              value={sector}
              onValueChange={setSector}
              required
              disabled={bondExists === true}
            >
              <SelectTrigger id="sector">
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
            {errors.sector && (
              <p className="text-sm text-red-500">{errors.sector}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Bond Amount (in lamports)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 1000000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              disabled={bondExists === true}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount}</p>
            )}
            <p className="text-xs text-muted-foreground">
              1 SOL = 1,000,000,000 lamports
            </p>
          </div>
          <Button
            type="submit"
            disabled={!connected || isLoading || bondExists === true}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initializing...
              </div>
            ) : bondExists === true ? (
              "Bond Account Already Exists"
            ) : (
              "Initialize Bond"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
