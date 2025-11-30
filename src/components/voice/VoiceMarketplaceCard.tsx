import { useState } from "react";
import { VoiceMetadata } from "@/hooks/useVoiceMetadata";
import { usePayForInference } from "@/hooks/usePayForInference";
import { useRewards } from "@/contexts/RewardsContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Coins, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatAddress } from "@/lib/aptos";

interface VoiceMarketplaceCardProps {
  voice: VoiceMetadata;
  onPaymentSuccess?: (txHash: string, voice: VoiceMetadata) => void;
}

export function VoiceMarketplaceCard({ voice, onPaymentSuccess }: VoiceMarketplaceCardProps) {
  const { payForInference, getPaymentBreakdown, isPaying } = usePayForInference();
  const { discountPercentage } = useRewards();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  // Calculate discounted price
  const originalPrice = voice.pricePerUse;
  const discountedPrice = originalPrice * (1 - discountPercentage / 100);
  const hasDiscount = discountPercentage > 0;

  const breakdown = getPaymentBreakdown(discountedPrice);

  const handlePurchase = async () => {
    setShowPaymentDialog(false);

    const result = await payForInference({
      creatorAddress: voice.owner,
      amount: discountedPrice, // Use discounted price
      royaltyRecipient: voice.owner, // Can be different if there's an original creator
      onSuccess: (txHash) => {
        if (onPaymentSuccess) {
          onPaymentSuccess(txHash, voice);
        }
      },
    });

    if (result?.success) {
      // Payment successful - trigger voice generation in parent component
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {voice.name}
            <div className="flex items-center gap-2">
              {hasDiscount && (
                <Badge variant="outline" className="text-xs line-through text-muted-foreground">
                  {originalPrice} APT
                </Badge>
              )}
              <Badge variant={hasDiscount ? "default" : "secondary"} className={hasDiscount ? "bg-green-500 hover:bg-green-600" : ""}>
                {hasDiscount && <Sparkles className="w-3 h-3 mr-1" />}
                {discountedPrice.toFixed(4)} APT
              </Badge>
            </div>
          </CardTitle>
          <CardDescription className="flex items-center justify-between">
            <span>by {formatAddress(voice.owner)}</span>
            {hasDiscount && (
              <span className="text-green-500 text-xs font-semibold">
                {discountPercentage}% OFF
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Rights:</span>{" "}
            <span className="font-medium">{voice.rights}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Voice ID:</span>{" "}
            <span className="font-mono text-xs">{voice.voiceId}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Model:</span>{" "}
            <span className="font-mono text-xs truncate block">{voice.modelUri}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => setShowPaymentDialog(true)}
            disabled={isPaying}
            className="w-full"
          >
            {isPaying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Use Voice
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Review the payment breakdown before proceeding
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Voice:</span>
              <span className="font-medium">{voice.name}</span>
            </div>

            {hasDiscount && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2 text-green-500 font-semibold text-sm">
                  <Sparkles className="w-4 h-4" />
                  PAT Discount Applied!
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Original Price:</span>
                  <span className="line-through">{originalPrice} APT</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Discount ({discountPercentage}%):</span>
                  <span className="text-green-500">-{(originalPrice - discountedPrice).toFixed(4)} APT</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold border-t border-green-500/30 pt-1 mt-1">
                  <span>You Pay:</span>
                  <span className="text-green-500">{discountedPrice.toFixed(4)} APT</span>
                </div>
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">{breakdown.total.toFixed(4)} APT</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Platform Fee (2.5%):</span>
                <span>{breakdown.platformFee.toFixed(4)} APT</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Royalty (10%):</span>
                <span>{breakdown.royalty.toFixed(4)} APT</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium border-t pt-2">
                <span>Creator Receives:</span>
                <span className="text-primary">{breakdown.creator.toFixed(4)} APT</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase} disabled={isPaying}>
              {isPaying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Confirm Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
