import { ArrowUpRightIcon, Folder, FormInput } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import Link from "next/link";

export function EmptyForm() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FormInput />
        </EmptyMedia>
        <EmptyTitle>No Form</EmptyTitle>
        <EmptyDescription>
          No forms found get started by creating your first form.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button>
            <Link href="/dashboard/forms/new">Create Form</Link>
          </Button>
        </div>
      </EmptyContent>
      <Button
        variant="link"
        asChild
        className="text-muted-foreground"
        size="sm"
      >
        <a href="#">
          Learn More <ArrowUpRightIcon />
        </a>
      </Button>
    </Empty>
  );
}
