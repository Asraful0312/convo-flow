"use client";

import { Suspense } from "react";
import FormSubmissionComponent from "./FormSubmissionComponent";

export default function FormSubmissionPage({
  params,
}: {
  params: { formId: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <FormSubmissionComponent params={params} />
    </Suspense>
  );
}
