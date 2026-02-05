import { useState, useEffect } from "react";
import { nowBD } from "@/lib/bdTime";

export function BangladeshTimeDisplay() {
  const [bdTime, setBdTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const time = nowBD();
      setBdTime(time.toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-background border-b">
      <div className="container mx-auto px-4 py-1">
        <p className="text-[10px] leading-tight font-normal text-muted-foreground/70">
          <span>Bangladesh Platform</span> — {bdTime}
        </p>
      </div>
    </div>
  );
}