"use client";

import { memo } from "react";

export const HeartOverlay = memo(function HeartOverlay({
  latest,
}: { latest: number | null }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 rounded-xl bg-black/60 px-4 py-2 text-white">
      <div className="text-xs opacity-75">Heart Rate</div>
      <div className="text-2xl font-semibold leading-none">
        {latest ?? "--"} <span className="text-sm">bpm</span>
      </div>
    </div>
  );
});
