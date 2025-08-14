import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file found." }, { status: 400 });
    }

    // The file from request.formData() can be sent directly to Pinata's API
    const formData = new FormData();
    formData.append("file", file, file.name);

    const pinataMetadata = JSON.stringify({
      name: file.name,
    });
    formData.append("pinataMetadata", pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append("pinataOptions", pinataOptions);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`, // Ensure this matches your .env.local
      },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        `Pinata API Error: ${errorData.error?.reason || res.statusText}`
      );
    }

    const { IpfsHash } = await res.json();

    return NextResponse.json({ cid: IpfsHash }, { status: 200 });
  } catch (e: any) {
    console.error("API Route Error:", e);
    return NextResponse.json(
      { error: e.message || "Error uploading file to IPFS" },
      { status: 500 }
    );
  }
}
