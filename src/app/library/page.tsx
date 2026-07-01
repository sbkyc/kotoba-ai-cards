import { Suspense } from "react";
import { LibraryClient } from "@/components/LibraryClient";

export default function LibraryPage() {
  return (
    <Suspense fallback={<div />}>
      <LibraryClient />
    </Suspense>
  );
}
