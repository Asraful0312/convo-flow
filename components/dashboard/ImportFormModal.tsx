"use client";

import { useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UploadCloud, File as FileIcon, Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import * as pdfjsLib from "pdfjs-dist";

// Configure the worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

type ImportFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (formId: Id<"forms">) => void;
};

export default function ImportFormModal({
  isOpen,
  onClose,
  onImportSuccess,
}: ImportFormModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const generateFormFromText = useAction(api.ai.generateFormFromText);
  const createFormFromUpload = useMutation(api.forms.createFormFromUpload);
  const user = useQuery(api.auth.loggedInUser);
  const activeWorkspace = user?.activeWorkspace;

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      if (
        selectedFile.type !== "application/pdf" &&
        selectedFile.type !== "application/json"
      ) {
        toast.error("Please upload a PDF or JSON file.");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileChange(droppedFile);
  };

  const handleImport = async () => {
    if (!file || !activeWorkspace) return;

    setIsLoading(true);
    try {
      const fileReader = new FileReader();

      // Handle JSON files
      if (file.type === "application/json") {
        setLoadingMessage("Reading JSON file...");
        fileReader.readAsText(file);

        fileReader.onload = async (event) => {
          if (!event.target?.result) {
            toast.error("Could not read the file.");
            setIsLoading(false);
            return;
          }
          try {
            const formData = JSON.parse(event.target.result as string);

            if (!formData.title || !formData.questions) {
              toast.error(
                "Invalid JSON structure. Must include 'title' and 'questions' keys.",
              );
              setIsLoading(false);
              setFile(null);
              return;
            }

            setLoadingMessage("Creating new form...");
            const newFormId = await createFormFromUpload({
              workspaceId: activeWorkspace._id,
              title: formData.title,
              description: formData.description,
              questions: formData.questions,
            });

            toast.success("Form imported successfully!");
            onImportSuccess(newFormId);
          } catch (error) {
            console.error("Error parsing JSON or creating form:", error);
            toast.error("Failed to process the JSON file. Please check its format.");
            setIsLoading(false);
            setFile(null);
          }
        };
      }
      // Handle PDF files
      else {
        setLoadingMessage("Reading PDF file...");
        fileReader.readAsArrayBuffer(file);

        fileReader.onload = async (event) => {
          if (!event.target?.result) {
            toast.error("Could not read the file.");
            setIsLoading(false);
            return;
          }

          try {
            const typedArray = new Uint8Array(
              event.target.result as ArrayBuffer,
            );
            const pdf = await pdfjsLib.getDocument(typedArray).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(" ");
              fullText += pageText + "\n\n";
            }

            if (fullText.trim().length < 20) {
              toast.error(
                "The PDF seems to be empty or does not contain readable text.",
              );
              setIsLoading(false);
              setFile(null);
              return;
            }

            setLoadingMessage("Analyzing document with AI...");
            const formData = await generateFormFromText({ prompt: fullText });

            if (formData.clarification) {
              toast.error(`Import failed: ${formData.clarification}`);
              setIsLoading(false);
              setFile(null);
              return;
            }

            if (!formData.title || !formData.questions) {
              console.error("AI returned unexpected data:", formData);
              toast.error(
                "Import failed: The AI could not understand the document structure.",
              );
              setIsLoading(false);
              setFile(null);
              return;
            }

            setLoadingMessage("Creating new form...");
            const newFormId = await createFormFromUpload({
              workspaceId: activeWorkspace._id,
              title: formData.title,
              description: formData.description,
              questions: formData.questions,
            });

            toast.success("Form imported successfully!");
            onImportSuccess(newFormId);
          } catch (error) {
            console.error(
              "Error during PDF processing or AI generation:",
              error,
            );
            toast.error(
              "Failed to process the PDF. It might be corrupted or protected.",
            );
            setIsLoading(false);
            setFile(null);
          }
        };
      }

      fileReader.onerror = () => {
        toast.error("An error occurred while reading the file.");
        setIsLoading(false);
      };
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsLoading(false);
      setFile(null);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setFile(null);
          setIsLoading(false);
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import a new form</DialogTitle>
          <DialogDescription>
            Upload a PDF or JSON file and we&apos;ll convert it into a Candid
            form for you.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">
                {loadingMessage}
              </p>
            </div>
          )}
          {!file ? (
            <div
              onDragEnter={handleDragEnter}
              onDragOver={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragOver ? "border-primary bg-primary/10" : "border-border"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.json"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <UploadCloud className="w-10 h-10 text-muted-foreground" />
                <span className="font-semibold">Drag & drop a file here</span>
                <span className="text-sm text-muted-foreground">or</span>
                <Button asChild variant="outline">
                  <span>Browse files</span>
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  PDF or JSON files are supported.
                </p>
              </label>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg w-full">
                <FileIcon className="w-6 h-6 text-primary" />
                <div className="flex-1">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => setFile(null)}
                  className="w-full"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  className="w-full"
                  disabled={isLoading}
                >
                  Import Form
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
