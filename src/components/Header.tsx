// Header.tsx - Final version with WalletButton
"use client";

import Link from "next/link";
import { ModeToggle } from "./toggle";
import { Button } from "./ui/button";
import { ShieldCheck, Menu, X } from "lucide-react";
import { useState } from "react";
import { WalletButton } from "./WalletButton"; // Import the new component

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full max-w-screen-2xl mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo and brand */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-none">
              CrypTrust DAO
            </span>
            <span className="text-xs text-muted-foreground">
              Transparent Funding
            </span>
          </div>
        </Link>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center justify-center gap-8 text-sm font-medium">
          <Link
            href="/proposals"
            className="relative transition-colors hover:text-primary text-foreground/70 hover:text-foreground group"
          >
            Proposals
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link
            href="/dashboard"
            className="relative transition-colors hover:text-primary text-foreground/70 hover:text-foreground group"
          >
            Dashboard
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link
            href="/create"
            className="relative transition-colors hover:text-primary text-foreground/70 hover:text-foreground group"
          >
            Create Proposal
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
          <Link
            href="/governance"
            className="relative transition-colors hover:text-primary text-foreground/70 hover:text-foreground group"
          >
            Governance
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3">
            <ModeToggle />
            <Button variant="outline" size="sm" className="hidden lg:flex">
              Join DAO
            </Button>
            {/* Replace the old Button with the new WalletButton component */}
            <WalletButton />
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur">
          <nav className="w-full max-w-screen-2xl mx-auto px-4 py-4 flex flex-col space-y-3">
            <Link
              href="/proposals"
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-colors text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Proposals
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-colors text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/create"
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-colors text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Proposal
            </Link>
            <Link
              href="/governance"
              className="px-3 py-2 rounded-md text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-accent transition-colors text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Governance
            </Link>
            <div className="flex items-center justify-center gap-3 pt-2 border-t">
              <ModeToggle />
              <Button variant="outline" size="sm" className="flex-1">
                Join DAO
              </Button>
              {/* Replace the old Button in the mobile menu as well */}
              <div className="flex-1">
                <WalletButton />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
