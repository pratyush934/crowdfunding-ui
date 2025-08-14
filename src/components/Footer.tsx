import Link from "next/link";
import {
  ShieldCheck,
  Twitter,
  Github,
  Linkedin,
  Mail,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

const footerLinks = {
  product: [
    { name: "Features", href: "#features" },
    { name: "Proposals", href: "/proposals" },
    { name: "Dashboard", href: "/dashboard" },
    { name: "Governance", href: "/governance" },
    { name: "API", href: "/api" },
    { name: "Integrations", href: "/integrations" },
  ],
  resources: [
    { name: "Documentation", href: "/docs" },
    { name: "Tutorials", href: "/tutorials" },
    { name: "Blog", href: "/blog" },
    { name: "Community", href: "/community" },
    { name: "Whitepaper", href: "/whitepaper" },
    { name: "Research", href: "/research" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Team", href: "/team" },
    { name: "Investors", href: "/investors" },
    { name: "Press Kit", href: "/press" },
    { name: "Contact", href: "/contact" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Security", href: "/security" },
    { name: "Compliance", href: "/compliance" },
    { name: "Bug Bounty", href: "/bug-bounty" },
  ],
  useCases: [
    { name: "Elections", href: "/use-cases/elections" },
    { name: "Disaster Relief", href: "/use-cases/disaster-relief" },
    { name: "Healthcare", href: "/use-cases/healthcare" },
    { name: "Education", href: "/use-cases/education" },
    { name: "Climate", href: "/use-cases/climate" },
    { name: "Social Impact", href: "/use-cases/social-impact" },
  ],
};

const socialLinks = [
  { name: "Twitter", href: "https://twitter.com/cryptrustdao", icon: Twitter },
  { name: "GitHub", href: "https://github.com/cryptrustdao", icon: Github },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/cryptrustdao",
    icon: Linkedin,
  },
  { name: "Email", href: "mailto:hello@cryptrustdao.org", icon: Mail },
];

const stats = [
  { label: "Countries", value: "45+" },
  { label: "Organizations", value: "1,200+" },
  { label: "Proposals Funded", value: "3,847" },
  { label: "Community Members", value: "50K+" },
];

export function Footer() {
  return (
    <footer className="w-full border-t bg-gradient-to-b from-background to-muted/20">
      {/* Newsletter Section */}
      <section className="w-full py-12 md:py-16 border-b">
        <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-4 text-center lg:text-left">
              <Badge className="mx-auto lg:mx-0 bg-primary/10 text-primary border-primary/20 w-fit">
                Stay Updated
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold">
                Get the latest updates on transparent funding
              </h3>
              <p className="text-muted-foreground">
                Join our newsletter to stay informed about new features,
                governance decisions, and funding opportunities in the CrypTrust
                ecosystem.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1"
                />
                <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  Subscribe
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                By subscribing, you agree to our Privacy Policy and consent to
                receive updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-8 md:py-12 border-b">
        <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-items-center">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="text-2xl md:text-3xl font-bold text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Footer Content */}
      <section className="w-full py-12 md:py-16">
        <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-6">
            {/* Brand Column */}
            <div className="lg:col-span-2 space-y-6 text-center lg:text-left">
              <Link
                href="/"
                className="flex items-center justify-center lg:justify-start space-x-3"
              >
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div className="flex flex-col">
                  <span className="font-bold text-lg leading-none">
                    CrypTrust DAO
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Transparent Funding
                  </span>
                </div>
              </Link>
              <p className="text-muted-foreground max-w-md mx-auto lg:mx-0">
                Building the future of transparent, accountable, and
                privacy-preserving public funding through blockchain technology
                and decentralized governance.
              </p>
              <div className="flex justify-center lg:justify-start space-x-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Link
                      key={social.name}
                      href={social.href}
                      className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-primary/10 rounded-lg"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="sr-only">{social.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-4 text-center lg:text-left">
              <h4 className="font-semibold">Product</h4>
              <ul className="space-y-3 text-sm">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Use Cases Links */}
            <div className="space-y-4 text-center lg:text-left">
              <h4 className="font-semibold">Use Cases</h4>
              <ul className="space-y-3 text-sm">
                {footerLinks.useCases.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div className="space-y-4 text-center lg:text-left">
              <h4 className="font-semibold">Resources</h4>
              <ul className="space-y-3 text-sm">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company & Legal Links */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <h4 className="font-semibold">Company</h4>
                <ul className="space-y-3 text-sm">
                  {footerLinks.company.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold">Legal</h4>
                <ul className="space-y-3 text-sm">
                  {footerLinks.legal.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Bar */}
      <section className="w-full py-6 border-t">
        <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
              <p>© 2025 CrypTrust DAO. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-xs">
                  v2.1.0
                </Badge>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
