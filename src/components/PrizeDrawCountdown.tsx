import React, { useState, useEffect } from "react";

interface PrizeDrawCountdownProps {
  drawDate: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function PrizeDrawCountdown({ drawDate }: PrizeDrawCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining(drawDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(drawDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [drawDate]);

  function calculateTimeRemaining(targetDate: string): TimeRemaining {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      isExpired: false,
    };
  }

  if (timeRemaining.isExpired) {
    return (
      <div className="text-center py-8">
        <p className="text-xl font-semibold text-muted-foreground">Draw has ended</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white text-center">
        <div className="text-4xl font-bold mb-2">{timeRemaining.days}</div>
        <div className="text-sm uppercase tracking-wider opacity-90">Days</div>
      </div>
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white text-center">
        <div className="text-4xl font-bold mb-2">{timeRemaining.hours}</div>
        <div className="text-sm uppercase tracking-wider opacity-90">Hours</div>
      </div>
      <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg p-6 text-white text-center">
        <div className="text-4xl font-bold mb-2">{timeRemaining.minutes}</div>
        <div className="text-sm uppercase tracking-wider opacity-90">Minutes</div>
      </div>
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white text-center">
        <div className="text-4xl font-bold mb-2">{timeRemaining.seconds}</div>
        <div className="text-sm uppercase tracking-wider opacity-90">Seconds</div>
      </div>
    </div>
  );
}