"use client";

import { ProposalCard } from "@/components/Proposals";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useProposals } from "@/hooks/useProposals";
import { AlertCircle } from "lucide-react";

export default function ProposalsPage() {
  // 1. Use our custom hook to fetch data
  const { proposals, isLoading, error } = useProposals();

  // 2. Handle the loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center space-y-4 mb-12">
            <Skeleton className="h-12 w-96 mx-auto" />
            <Skeleton className="h-6 w-[600px] mx-auto" />
          </div>
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-80 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. Handle the error state
  if (error) {
    return (
      <div className="min-h-screen w-full bg-background flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive" className="shadow-lg">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">
              Error Fetching Proposals
            </AlertTitle>
            <AlertDescription className="mt-2">
              There was a problem connecting to the blockchain. Please try again
              later.
              <pre className="mt-3 p-3 bg-muted rounded text-xs overflow-x-auto">
                {error.message}
              </pre>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // 4. Display the fetched data
  return (
    <div className="min-h-screen w-full bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            DAO Governance Proposals
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Browse, discuss, and vote on proposals to shape the future of the
            CrypTrust ecosystem.
          </p>
        </div>

        {/* Content Section */}
        {proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Proposals Yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              No proposals have been created yet. Be the first to submit a
              proposal to help shape the community!
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {proposals.map((proposal) => (
              <div
                key={proposal.id.toString()}
                className="transform transition-all duration-200 hover:scale-105"
              >
                <ProposalCard proposal={proposal} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
