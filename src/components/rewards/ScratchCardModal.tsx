import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRewards } from "@/contexts/RewardsContext";
import { Ticket, Sparkles, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ScratchCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    reward: number;
    patBalance: number;
    discountPercentage: number;
}

export const ScratchCardModal = ({ isOpen, onClose, reward, patBalance, discountPercentage }: ScratchCardModalProps) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const [isScratching, setIsScratching] = useState(false);

    const originalPrice = 100; // Example base price for a "pack" or "subscription"
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    const handleScratch = async () => {
        setIsScratching(true);
        try {
            // Simulate scratching animation
            await new Promise(resolve => setTimeout(resolve, 1500));

            setIsRevealed(true);
            toast.success("Reward Revealed!", {
                description: `You earned +${reward} PAT! New balance: ${patBalance} PAT`
            });
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsScratching(false);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset state after a short delay so it's fresh next time
        setTimeout(() => setIsRevealed(false), 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-900/90 to-blue-900/90 border-yellow-500/30 backdrop-blur-xl text-white">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl flex items-center justify-center gap-2">
                        <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
                        Payment Successful!
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-300">
                        Scratch to reveal your reward
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl text-center">
                            <div className="text-sm text-gray-400">Your Balance</div>
                            <div className="text-2xl font-bold text-yellow-400">{patBalance} PAT</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl text-center">
                            <div className="text-sm text-gray-400">Current Discount</div>
                            <div className="text-2xl font-bold text-green-400">{discountPercentage}%</div>
                        </div>
                    </div>

                    {!isRevealed ? (
                        <div className="space-y-6">
                            {/* Scratch Card */}
                            <div className="relative bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-8 rounded-2xl border-2 border-yellow-500/50 text-center space-y-4 cursor-pointer hover:scale-105 transition-transform"
                                onClick={handleScratch}>
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center">
                                    <div className="text-center space-y-2">
                                        <Ticket className="w-16 h-16 text-gray-600 mx-auto" />
                                        <p className="text-gray-500 font-medium">Click to Scratch!</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black border-none"
                                onClick={handleScratch}
                                disabled={isScratching}
                            >
                                {isScratching ? (
                                    <Sparkles className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <Sparkles className="w-5 h-5 mr-2" />
                                )}
                                {isScratching ? "Scratching..." : "Scratch Card"}
                            </Button>

                            <div className="text-center text-sm text-gray-400">
                                Current Balance: {patBalance - reward} PAT → {patBalance} PAT
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 p-8 rounded-2xl border-2 border-yellow-500/50 text-center space-y-4">
                                <div className="flex justify-center">
                                    <div className="p-4 bg-yellow-500/20 rounded-full">
                                        <Sparkles className="w-16 h-16 text-yellow-400" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-yellow-400">+{reward} PAT</h3>
                                    <p className="text-gray-300 mt-2">
                                        Congratulations! You earned {reward} PAT token{reward > 1 ? 's' : ''}!
                                    </p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-xl space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">New Balance:</span>
                                        <span className="text-yellow-400 font-bold">{patBalance} PAT</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Current Discount:</span>
                                        <span className="text-green-400 font-bold">{discountPercentage}%</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                    {discountPercentage < 10 && "Earn more PAT to unlock higher discounts!"}
                                    {discountPercentage >= 10 && discountPercentage < 20 && "Great! Keep earning to reach 20% discount!"}
                                    {discountPercentage >= 20 && "Amazing! You've unlocked maximum discount!"}
                                </div>
                            </div>

                            <Button
                                className="w-full bg-white/10 hover:bg-white/20 border-white/20"
                                onClick={handleClose}
                            >
                                Continue to Generate Voice
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
