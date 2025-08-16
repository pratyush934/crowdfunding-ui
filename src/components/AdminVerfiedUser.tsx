import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAppStore } from "@/store";
import { PublicKey, SystemProgram } from "@solana/web3.js";
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
import { toast } from "sonner";
import { Shield, UserPlus } from "lucide-react";

export function AdminVerifyUser() {
  const { connected, publicKey } = useWallet();
  const { governanceProgram } = useAppStore();
  const [userToVerify, setUserToVerify] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check if current user is admin
  const checkAdminStatus = async () => {
    if (!connected || !publicKey || !governanceProgram) return;

    setIsCheckingAdmin(true);
    try {
      const [govState] = PublicKey.findProgramAddressSync(
        [Buffer.from("governance_state")],
        governanceProgram.programId
      );

      const governanceState =
        await governanceProgram.account.governanceState.fetch(govState);
      const adminStatus = governanceState.admin.equals(publicKey);
      setIsAdmin(adminStatus);

      if (!adminStatus) {
        toast.info("You are not an admin", {
          description: `Current admin: ${governanceState.admin.toString()}`,
        });
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setIsCheckingAdmin(false);
    }
  };

  // Effect to check admin status when wallet connects
  React.useEffect(() => {
    if (connected && publicKey && governanceProgram) {
      checkAdminStatus();
    } else {
      setIsAdmin(null);
    }
  }, [connected, publicKey, governanceProgram]);

  const handleVerifyUser = async () => {
    if (!connected || !publicKey || !governanceProgram) {
      toast.error("Please connect your wallet.");
      return;
    }

    if (!isAdmin) {
      toast.error("Only admins can verify users.");
      return;
    }

    if (!userToVerify) {
      toast.error("Please enter a user public key to verify.");
      return;
    }

    let userPublicKey: PublicKey;
    try {
      userPublicKey = new PublicKey(userToVerify);
    } catch (error) {
      toast.error("Invalid public key format.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Verifying user...");

    try {
      // Derive verified user PDA
      const [verifiedUserPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("verified_user"), userPublicKey.toBuffer()],
        governanceProgram.programId
      );

      // Check if user is already verified
      const existingAccount =
        await governanceProgram.provider.connection.getAccountInfo(
          verifiedUserPda
        );
      if (existingAccount) {
        toast.info("User is already verified", { id: toastId });
        return;
      }

      // Call add_verified_user instruction
      const tx = await governanceProgram.methods
        .addVerifiedUser()
        .accounts({
          verifiedUser: verifiedUserPda,
          userToVerify: userPublicKey,
          admin: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      toast.success("User verified successfully!", {
        id: toastId,
        description: (
          <div>
            <p>User: {userPublicKey.toString()}</p>
            <p>Transaction: {tx}</p>
          </div>
        ),
      });

      // Reset form
      setUserToVerify("");
    } catch (err: any) {
      console.error("Error verifying user:", err);

      let errorMessage = "Failed to verify user.";
      if (err.message?.includes("already in use")) {
        errorMessage = "User is already verified.";
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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin: Verify Users
          </CardTitle>
          <CardDescription>
            Please connect your wallet to access admin functions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin: Verify Users
        </CardTitle>
        <CardDescription>
          Add verified users who can create proposals in the governance system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Admin Status Display */}
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Admin Status</h3>
              <p className="text-sm text-muted-foreground">
                {isCheckingAdmin
                  ? "Checking admin status..."
                  : isAdmin === true
                  ? "✅ You are an admin"
                  : isAdmin === false
                  ? "❌ You are not an admin"
                  : "Connect wallet to check status"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkAdminStatus}
              disabled={isCheckingAdmin || !connected}
            >
              {isCheckingAdmin ? "Checking..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="userToVerify">User Public Key to Verify</Label>
            <Input
              id="userToVerify"
              placeholder="Enter the user's public key (e.g., 4fYNw3dojWmQ...)"
              value={userToVerify}
              onChange={(e) => setUserToVerify(e.target.value)}
              disabled={!isAdmin}
            />
            <p className="text-xs text-muted-foreground">
              This user will be able to create proposals in the governance
              system.
            </p>
          </div>

          <Button
            onClick={handleVerifyUser}
            disabled={!connected || !isAdmin || isLoading || !userToVerify}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying User...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Verify User
              </div>
            )}
          </Button>

          {!isAdmin && connected && (
            <p className="text-sm text-muted-foreground text-center">
              Only governance admins can verify users.
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="font-medium mb-2">Quick Actions</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUserToVerify(publicKey?.toString() || "")}
              disabled={!publicKey}
            >
              Verify Self
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Copy current wallet address to clipboard
                if (publicKey) {
                  navigator.clipboard.writeText(publicKey.toString());
                  toast.success("Wallet address copied to clipboard");
                }
              }}
              disabled={!publicKey}
            >
              Copy My Address
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
