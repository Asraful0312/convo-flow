import { Suspense } from "react";
import FormSubmissionComponent from "./FormSubmissionComponent";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { redirect } from "next/navigation";

export default async function FormSubmissionPage({
  params,
}: {
  params: { formId: string };
}) {
  const form: any = await fetchQuery(api.forms.getPublicFormData, {
    formId: params.formId as Id<"forms">,
  });

  console.log("form server", form?.status);
  if (form && form?.status !== "published") {
    redirect("/private-form");
  }

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
