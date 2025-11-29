import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic2, Menu, X, Wallet, LogOut, Copy, Check } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { toast } from "sonner";
import { formatAddress } from "@/lib/aptos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Create Voice" },
];

export function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { connected, account, connect, disconnect } = useWallet();

  const walletAddress = account?.address?.toString() || '';

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Address copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConnect = async () => {
    try {
      await connect('Petra');
      toast.success('Wallet Connected', {
        description: 'Successfully connected to Petra wallet',
      });
    } catch (error) {
      console.error('Connection error:', error);
      if (error instanceof Error) {
        toast.error('Connection Failed', {
          description: error.message,
        });
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success('Wallet Disconnected');
    } catch (error) {
      console.error('Disconnection error:', error);
      if (error instanceof Error) {
        toast.error('Disconnection Failed', {
          description: error.message,
        });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full group-hover:bg-primary/50 transition-all duration-300" />
              <img 
                src="/aptos.jpeg" 
                alt="Aptos Logo" 
                className="relative h-10 w-10 rounded-full object-cover"
              />
            </div>
            <span className="font-display text-xl font-bold gradient-text">VoiceVault</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  location.pathname === link.href
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="hidden md:flex items-center gap-3">
            {connected && walletAddress ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="gradient" size="default" className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    {formatAddress(walletAddress)}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="font-mono text-xs cursor-pointer"
                    onClick={handleCopyAddress}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="truncate flex-1">{walletAddress}</span>
                      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDisconnect} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="gradient" 
                size="default" 
                onClick={handleConnect}
                className="flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                Connect Petra
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    location.pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Button 
                variant="gradient" 
                className="mt-2 flex items-center gap-2"
                onClick={connected ? handleDisconnect : handleConnect}
              >
                {connected ? (
                  <>
                    <LogOut className="h-4 w-4" />
                    Disconnect
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4" />
                    Connect Petra
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
