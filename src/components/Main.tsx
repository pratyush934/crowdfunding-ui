import {
  Lock,
  Rocket,
  Shield,
  Users,
  ArrowRight,
  Play,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { Badge } from "./ui/badge";

const features = [
  {
    icon: <Users className="h-10 w-10 text-primary" />,
    title: "DAO-Based Governance",
    description:
      "Decisions are made by the community, ensuring transparent and decentralized oversight of all funding.",
    stats: "1,247 Active Voters",
  },
  {
    icon: <Lock className="h-10 w-10 text-primary" />,
    title: "Programmable Vesting",
    description:
      "Funds are released automatically based on verifiable, real-world milestones, guaranteeing accountability.",
    stats: "$2.4M Secured",
  },
  {
    icon: <Shield className="h-10 w-10 text-primary" />,
    title: "Privacy-Preserving ID",
    description:
      "Verify your identity using decentralized credentials without exposing sensitive personal data.",
    stats: "Zero-Knowledge Proofs",
  },
  {
    icon: <Rocket className="h-10 w-10 text-primary" />,
    title: "Cross-Sector Ready",
    description:
      "A universal framework designed for elections, disaster relief, healthcare, education, and more.",
    stats: "15+ Use Cases",
  },
];

const stats = [
  { label: "Total Funded", value: "$12.8M" },
  { label: "Active Proposals", value: "342" },
  { label: "DAO Members", value: "5,241" },
  { label: "Success Rate", value: "94%" },
];

const trustedBy = [
  "Ethereum Foundation",
  "Polygon",
  "Chainlink",
  "UNICEF",
  "Red Cross",
  "OpenAI",
];

export default function Main() {
  return (
    <main className="flex-1 w-full">
      {/* Hero Section */}
      <section className="relative w-full py-12 md:py-24 lg:py-32 xl:py-48 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-48 translate-x-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-y-48 -translate-x-48" />

        <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
          <div className="grid gap-12 lg:grid-cols-[1fr_500px] lg:gap-20 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-8">
              {/* Badge */}
              <Badge className="w-fit bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                🚀 Now Live on Mainnet
              </Badge>

              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl xl:text-7xl/none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Transparent, Accountable Funding for a{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Better World
                  </span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                  CrypTrust DAO leverages blockchain and zero-knowledge
                  cryptography to build a secure, programmable, and
                  privacy-preserving framework for public funds.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/proposals"
                  className={`${buttonVariants({
                    size: "lg",
                  })} bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/25 transition-all duration-300 group`}
                >
                  Explore Proposals
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/demo"
                  className={`${buttonVariants({
                    variant: "outline",
                    size: "lg",
                  })} group hover:bg-accent/50 transition-all duration-300`}
                >
                  <Play className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="space-y-1">
                    <p className="text-2xl md:text-3xl font-bold text-primary">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl" />
                <div className="relative bg-background/80 backdrop-blur border rounded-3xl p-8 shadow-2xl">
                  <ShieldCheckIcon className="h-48 w-48 md:h-64 md:w-64 text-primary/20" />
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Secured
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="w-full py-12 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center space-y-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Trusted by Leading Organizations
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
              {trustedBy.map((org, index) => (
                <div
                  key={index}
                  className="text-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <p className="font-semibold">{org}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted/20"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Key Features
              </Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                A New Standard in{" "}
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Trust
                </span>
              </h2>
              <p className="max-w-[900px] text-muted-foreground text-lg md:text-xl/relaxed leading-relaxed">
                Our system combines cutting-edge technologies to solve the core
                problems of public funding: transparency, accountability, and
                privacy.
              </p>
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl items-start gap-8 sm:grid-cols-2 lg:grid-cols-2 mt-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border bg-background/50 backdrop-blur p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                      {feature.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.stats}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to Transform Funding?
              </h2>
              <p className="max-w-[600px] text-muted-foreground text-lg md:text-xl">
                Join thousands of organizations already using CrypTrust DAO for
                transparent, accountable funding.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/create"
                className={`${buttonVariants({
                  size: "lg",
                })} bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-primary/25 transition-all duration-300`}
              >
                Create Your First Proposal
              </Link>
              <Link
                href="/join-dao"
                className={`${buttonVariants({
                  variant: "outline",
                  size: "lg",
                })} hover:bg-accent/50 transition-all duration-300`}
              >
                Join the DAO
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

// Enhanced shield icon with animation potential
function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
