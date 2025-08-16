// pages/proposals/[id].tsx
import { useRouter } from "next/router";
import { useProposals } from "@/hooks/useProposals";
import Image from "next/image";

export default function ProposalDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { proposals } = useProposals();

  const proposal = proposals.find((p) => p.id.toString() === id);
  if (!proposal) return <div>Proposal not found</div>;

  return (
    <div>
      <h1>Proposal #{proposal.id.toString()}</h1>
      <p>Description: {proposal.description}</p>
      <p>Bond Purpose: {proposal.bondPurpose}</p>
      <p>Bond Sector: {proposal.bondSector}</p>
      <p>Amount: {proposal.bondAmount.toString()} lamports</p>
      {proposal.ipfsUrl && (
        <div>
          <p>Proof: {proposal.fileName}</p>
          <a href={proposal.ipfsUrl} target="_blank" rel="noopener noreferrer">
            View on IPFS
          </a>
          {proposal.fileName?.endsWith(".jpg") ||
          proposal.fileName?.endsWith(".jpeg") ||
          proposal.fileName?.endsWith(".png") ? (
            <Image
              src={proposal.ipfsUrl}
              alt="Proof"
              width={200}
              height={200}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
