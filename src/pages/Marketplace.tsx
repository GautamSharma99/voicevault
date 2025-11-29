import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VoiceCard } from "@/components/marketplace/VoiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, TrendingUp, Clock, Star } from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";

const mockVoices = [
  {
    id: "1",
    name: "Alex Sterling",
    creator: "voicemaster.apt",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    pricePerUse: 0.05,
    totalUses: 12400,
    rating: 4.9,
    tags: ["Male", "Deep", "Professional"],
  },
  {
    id: "2",
    name: "Luna Rivers",
    creator: "audioqueen.apt",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    pricePerUse: 0.08,
    totalUses: 8900,
    rating: 4.8,
    tags: ["Female", "Warm", "Narrator"],
  },
  {
    id: "3",
    name: "Marcus Deep",
    creator: "basstone.apt",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    pricePerUse: 0.03,
    totalUses: 24500,
    rating: 4.7,
    tags: ["Male", "Bass", "Audiobook"],
  },
  {
    id: "4",
    name: "Aria Voice",
    creator: "crystalclear.apt",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    pricePerUse: 0.06,
    totalUses: 15200,
    rating: 4.9,
    tags: ["Female", "Clear", "Commercial"],
  },
  {
    id: "5",
    name: "Zen Master",
    creator: "calmvoice.apt",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    pricePerUse: 0.04,
    totalUses: 31200,
    rating: 4.8,
    tags: ["Male", "Calm", "Meditation"],
  },
  {
    id: "6",
    name: "Ember Spark",
    creator: "firetalker.apt",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
    pricePerUse: 0.07,
    totalUses: 9800,
    rating: 4.6,
    tags: ["Female", "Energetic", "Gaming"],
  },
];

const filterTabs = [
  { id: "trending", label: "Trending", icon: TrendingUp },
  { id: "newest", label: "Newest", icon: Clock },
  { id: "top-rated", label: "Top Rated", icon: Star },
];

const Marketplace = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("trending");

  return (
    <>
      <Helmet>
        <title>Voice Marketplace - VoiceVault</title>
        <meta name="description" content="Discover and license AI voice models from creators worldwide. Find the perfect voice for your project." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="max-w-2xl mb-12">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Voice <span className="gradient-text">Marketplace</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Discover unique AI voice models from creators around the world. License instantly, pay per use.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search voices by name, creator, or style..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-card border-border"
                />
              </div>
              <Button variant="outline" className="h-12">
                <SlidersHorizontal className="h-5 w-5 mr-2" />
                Filters
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeFilter === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Voice Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockVoices.map((voice) => (
                <VoiceCard key={voice.id} voice={voice} />
              ))}
            </div>

            {/* Load More */}
            <div className="flex justify-center mt-12">
              <Button variant="outline" size="lg">
                Load More Voices
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Marketplace;
