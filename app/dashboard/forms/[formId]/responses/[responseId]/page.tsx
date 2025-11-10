"use client";

import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Trash2,
  Clock,
  Monitor,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { use, useState } from "react";

export default function ResponseDetailPage({
  params,
}: {
  params: { formId: string; responseId: string };
}) {
  const { formId } = use<any>(params as any);
  const router = useRouter();
  const { responseId } = use<any>(params as any);
  const [isExporting, setIsExporting] = useState(false);
  const data = useQuery(api.responses.getResponseDetailPageData, {
    responseId,
  });
  const deleteResponse = useMutation(api.responses.deleteResponse);
  const exportAction = useAction(api.exports.exportResponses);
  const getFileUrl = useMutation(api.files.getFileUrl);
  const conversation = data?.conversation;
  const questions = data?.questions;
  const answers = data?.answers;
  const form = data?.form;
  const response = data?.response;

  console.log(response);

  const handleDelete = async () => {
    if (!response) return;
    try {
      await deleteResponse({ responseId: response._id });
      toast.success("Response deleted successfully");
      router.push(`/dashboard/forms/${params.formId}/responses`);
    } catch (error) {
      toast.error("Failed to delete response");
      console.error("Failed to delete response:", error);
    }
  };

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    if (!response) return;
    setIsExporting(true);
    try {
      const url = await exportAction({
        formId: response.formId,
        responseIds: [response._id],
        format,
      });
      if (url) {
        window.open(url, "_blank");
        toast.success(
          `Export started. Your ${format.toUpperCase()} file will be available shortly.`,
        );
      } else {
        toast.error("Export failed");
      }
    } catch (error) {
      toast.error("Export failed");
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileDownload = async (storageId: Id<"_storage">) => {
    try {
      const url = await getFileUrl({ storageId });
      if (url) {
        window.open(url, "_blank");
      }
    } catch (error) {
      toast.error("Failed to get download link");
    }
  };

  if (data === undefined) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!form || !response) {
    notFound();
  }

  const completionTime = response.completedAt
    ? Math.round((response.completedAt - response.startedAt) / 1000 / 60)
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/forms/${formId}/responses`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Responses
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Response Details</h1>
            <p className="text-muted-foreground">{form.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-transparent"
            onClick={() => handleExport("pdf")}
          >
            <Download className="w-4 h-4" />
            Export
            {isExporting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
          </Button>
          <Button
            variant="outline"
            className="gap-2 text-destructive hover:text-destructive bg-transparent"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Response Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Response Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F56A4D]/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#F56A4D]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                  <p className="font-medium">
                    {response.completedAt
                      ? new Date(response.completedAt).toLocaleString()
                      : "In Progress"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f97316]/10 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-[#f97316]" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Device</p>
                  <p className="font-medium">
                    {response.metadata?.device} - {response.metadata?.browser}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Completion Time
                  </p>
                  <p className="font-medium">
                    {completionTime ? `${completionTime} minutes` : "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    response.status === "completed" ? "default" : "secondary"
                  }
                  className={
                    response.status === "completed"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : ""
                  }
                >
                  {response.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Thread */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <CardDescription>
            Full conversation thread with the respondent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {conversation?.messages.map((message, index) => {
              const question = questions?.find(
                (q) => q._id === message.questionId,
              );
              const answer = answers?.find(
                (a) => a.questionId === message.questionId,
              );

              let messageContent: React.ReactNode = message.content;
              if (
                message.role === "user" &&
                question?.type === "file" &&
                answer?.fileName
              ) {
                messageContent = (
                  <Button
                    variant="link"
                    onClick={() => handleFileDownload(answer.value)}
                    className="p-0 h-auto text-white"
                  >
                    {answer.fileName}
                  </Button>
                );
              }

              return (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-[#F56A4D] flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-medium">AI</span>
                    </div>
                  )}
                  <div
                    className={`flex-1 ${message.role === "user" ? "flex justify-end" : ""}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 max-w-[80%] ${message.role === "user" ? "bg-[#F56A4D] text-white rounded-tr-none" : "bg-muted rounded-tl-none"}`}
                    >
                      <p className="text-sm">{messageContent}</p>
                    </div>
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-[#f97316] flex items-center justify-center shrink-0">
                      <span className="text-white text-sm font-medium">U</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      {response?.sentiment && (
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
            <CardDescription>
              Automated analysis of this response
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Sentiment
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {response.sentiment}
                </p>
              </div>
            </div>
            {response.themes && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Key Themes</p>
                <div className="flex flex-wrap gap-2">
                  {response.themes.map((theme: string) => (
                    <Badge key={theme} variant="secondary">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {response.summary && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium mb-2">Summary</p>
                <p className="text-sm text-muted-foreground">
                  {response.summary}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
