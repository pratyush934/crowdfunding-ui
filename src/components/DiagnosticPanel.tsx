"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";

interface DiagnosticResult {
  name: string;
  status: "success" | "error" | "warning" | "pending";
  message: string;
  details?: string;
}

export function DiagnosticPanel() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // Test 1: Connection to local validator
    try {
      const connection = new Connection("http://127.0.0.1:8899", "confirmed");
      const version = await connection.getVersion();
      results.push({
        name: "Local Solana Validator",
        status: "success",
        message: `Connected successfully`,
        details: `Version: ${version["solana-core"]}, Feature Set: ${version["feature-set"]}`,
      });
    } catch (error) {
      results.push({
        name: "Local Solana Validator",
        status: "error",
        message: "Failed to connect",
        details: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 2: Program account checks
    const programIds = [
      {
        name: "OnChain Program",
        id: "6hPPwfMV5yMR6pCvg1kt2JaAT5FSRjnefuYQ74s62XLL",
      },
      {
        name: "Governance Program",
        id: "HbD9TyCRmTboM3QuL2h227hEhzKBfL3CTgqtohtGKP92",
      },
    ];

    for (const program of programIds) {
      try {
        const connection = new Connection("http://127.0.0.1:8899", "confirmed");
        const programId = new PublicKey(program.id);
        const accountInfo = await connection.getAccountInfo(programId);

        if (accountInfo) {
          results.push({
            name: program.name,
            status: "success",
            message: "Program deployed and found on chain",
            details: `Data length: ${
              accountInfo.data.length
            } bytes, Owner: ${accountInfo.owner.toBase58()}`,
          });
        } else {
          results.push({
            name: program.name,
            status: "warning",
            message: "Program account not found",
            details:
              "This is normal for fresh deployments. Deploy your program first.",
          });
        }
      } catch (error) {
        results.push({
          name: program.name,
          status: "error",
          message: "Failed to check program account",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Test 3: IDL validation
    try {
      const onChainIdl = await import("@/lib/programs/on_chain.json");
      const governanceIdl = await import("@/lib/programs/governance.json");

      results.push({
        name: "IDL Files",
        status: "success",
        message: "IDL files loaded successfully",
        details: `OnChain: ${
          onChainIdl.instructions?.length || 0
        } instructions, Governance: ${
          governanceIdl.instructions?.length || 0
        } instructions`,
      });
    } catch (error) {
      results.push({
        name: "IDL Files",
        status: "error",
        message: "Failed to load IDL files",
        details: error instanceof Error ? error.message : String(error),
      });
    }

    // Test 4: Node version and environment
    results.push({
      name: "Environment",
      status: "success",
      message: "Browser environment check",
      details: `User Agent: ${navigator.userAgent.substring(0, 100)}...`,
    });

    setDiagnostics(results);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-gray-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      case "warning":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          System Diagnostics
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            size="sm"
            variant="outline"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {diagnostics.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getStatusColor(
                result.status
              )}`}
            >
              <div className="flex items-start gap-3">
                {getIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{result.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-500 mt-1 font-mono break-all">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {diagnostics.some((d) => d.status === "error") && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">
              Troubleshooting Tips:
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Make sure your local Solana validator is running:{" "}
                <code className="bg-blue-100 px-1 rounded">
                  solana-test-validator
                </code>
              </li>
              <li>
                • Ensure your programs are deployed:{" "}
                <code className="bg-blue-100 px-1 rounded">anchor deploy</code>
              </li>
              <li>
                • Check that program IDs in your code match the deployed program
                IDs
              </li>
              <li>
                • Verify your wallet is connected and has SOL for transactions
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
