"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useWallet } from "@solana/wallet-adapter-react";
import { Upload, X, File as FileIcon } from "lucide-react";
import { toast } from "sonner";

export function FileUpload() {
  const { connected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cid, setCid] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setCid(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent the default form submission behavior

    if (!file) {
      toast.error("Please select a file first.");
      return;
    }
    if (!connected) {
      toast.error("Please connect your wallet to upload.");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Uploading file to IPFS...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setCid(data.cid);
      toast.success("File uploaded successfully!", {
        id: toastId,
        description: `IPFS CID: ${data.cid}`,
      });
      console.log("File uploaded successfully. CID:", data.cid);
    } catch (err : any) {
      console.error("Upload error:", err);
      toast.error("Upload failed.", {
        id: toastId,
        description: err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md p-6 border rounded-lg bg-background/50 shadow-md space-y-4"
    >
      <h3 className="text-lg font-semibold text-center">
        Upload Proof of Impact
      </h3>

      <div className="space-y-2">
        <label
          htmlFor="file-upload"
          className="text-sm font-medium text-muted-foreground"
        >
          Select File
        </label>
        <Input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
      </div>

      {file && (
        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <FileIcon className="h-4 w-4" />
            <span>{file.name}</span>
          </div>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="p-1 rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <Button
        type="submit"
        disabled={!file || uploading || !connected}
        className="w-full"
      >
        {uploading ? "Uploading..." : "Upload to IPFS"}
        <Upload className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
