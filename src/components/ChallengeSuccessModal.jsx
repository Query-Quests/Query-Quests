"use client";

import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Star,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Award,
} from "lucide-react";
import Link from "next/link";

export default function ChallengeSuccessModal({
  open,
  onOpenChange,
  pointsAwarded,
  totalScore,
  rank,
  solvedChallenges,
  nextChallenge,
  challengeName,
  alreadySolved,
}) {
  const [displayPoints, setDisplayPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);

  // Animate points counter
  useEffect(() => {
    if (open && pointsAwarded > 0) {
      setDisplayPoints(0);
      const duration = 1500;
      const steps = 30;
      const increment = pointsAwarded / steps;
      const stepTime = duration / steps;

      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= pointsAwarded) {
          setDisplayPoints(pointsAwarded);
          clearInterval(timer);
        } else {
          setDisplayPoints(Math.floor(current));
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [open, pointsAwarded]);

  // Trigger confetti
  useEffect(() => {
    if (open && !alreadySolved) {
      setShowConfetti(true);
      triggerConfetti();
    }
    return () => {
      setShowConfetti(false);
    };
  }, [open, alreadySolved]);

  const triggerConfetti = async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;

      // First burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#19aa59", "#4ade80", "#fbbf24", "#60a5fa"],
      });

      // Side bursts
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#19aa59", "#4ade80"],
        });
      }, 200);

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#19aa59", "#4ade80"],
        });
      }, 400);

      // Stars
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 100,
          origin: { y: 0.5 },
          shapes: ["star"],
          colors: ["#fbbf24", "#f59e0b"],
        });
      }, 600);
    } catch (error) {
      console.error("Confetti not available:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] text-center">
        <DialogHeader>
          <div className="mx-auto mb-4">
            {alreadySolved ? (
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center">
                <Award className="h-10 w-10 text-yellow-600" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                <Trophy className="h-10 w-10 text-green-600" />
              </div>
            )}
          </div>
          <DialogTitle className="text-2xl">
            {alreadySolved ? "Challenge Completed!" : "Congratulations!"}
          </DialogTitle>
          <DialogDescription>
            {alreadySolved
              ? `You've already solved "${challengeName}"`
              : `You successfully solved "${challengeName}"!`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Points Display */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Points Earned
              </span>
            </div>
            <div className="text-5xl font-bold text-green-600">
              +{displayPoints}
            </div>
            {alreadySolved && (
              <p className="text-sm text-muted-foreground mt-2">
                No additional points for re-solving
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-blue-700">Total Score</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {totalScore?.toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-4 w-4 text-purple-600" />
                <span className="text-xs text-purple-700">Your Rank</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">#{rank}</div>
            </div>
          </div>

          {/* Challenges Solved */}
          {solvedChallenges && (
            <div className="flex items-center justify-center gap-2">
              <Badge variant="secondary" className="px-4 py-2">
                <Trophy className="h-4 w-4 mr-2" />
                {solvedChallenges} Challenges Solved
              </Badge>
            </div>
          )}

          {/* Next Challenge */}
          {nextChallenge && !alreadySolved && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Ready for the next challenge?
              </p>
              <Button asChild className="w-full" size="lg">
                <Link href={`/challenges/${nextChallenge.id}`}>
                  {nextChallenge.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Level {nextChallenge.level} - {nextChallenge.current_score} points
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Continue Practicing
          </Button>
          <Button asChild className="flex-1">
            <Link href="/challenges">All Challenges</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
