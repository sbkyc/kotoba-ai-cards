import { Suspense } from "react";
import { PracticeHistoryClient } from "@/components/PracticeHistoryClient";

export default function PracticeHistoryPage() {
  return (
    <Suspense fallback={<div />}>
      <PracticeHistoryClient />
    </Suspense>
  );
}
