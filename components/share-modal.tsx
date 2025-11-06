"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Check,
  Code,
  Copy,
  Facebook,
  Linkedin,
  Mail,
  Share,
  Twitter,
  MessageCircle,
  Send,

} from "lucide-react";
import { useId, useRef, useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

function ShareModal({ formId, title }: { formId: Id<"forms">; title: string }) {
  const id = useId();
  const [copied, setCopied] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    if (inputRef.current) {
      navigator.clipboard.writeText(inputRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const shareUrl = `${window.location.origin}/f/${formId}`;
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
  };

  const openShare = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  return (
    <div className="flex flex-col gap-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm">
            <Share className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="flex flex-col gap-3 text-center">
            <div className="text-sm font-medium">Share this form</div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="icon" variant="outline" aria-label="Embed">
                <Code size={16} strokeWidth={2} />
              </Button>
              <Button
                onClick={() => openShare(shareLinks.twitter)}
                size="icon"
                variant="outline"
                aria-label="Share on Twitter"
              >
                <Twitter size={16} strokeWidth={2} />
              </Button>
              <Button
                onClick={() => openShare(shareLinks.facebook)}
                size="icon"
                variant="outline"
                aria-label="Share on Facebook"
              >
                <Facebook size={16} strokeWidth={2} />
              </Button>
              <Button
                onClick={() => openShare(shareLinks.linkedin)}
                size="icon"
                variant="outline"
                aria-label="Share on LinkedIn"
              >
                <Linkedin size={16} strokeWidth={2} />
              </Button>
              <Button
                onClick={() => openShare(shareLinks.whatsapp)}
                size="icon"
                variant="outline"
                aria-label="Share on WhatsApp"
              >
                <MessageCircle size={16} strokeWidth={2} />
              </Button>
              <Button
                onClick={() => openShare(shareLinks.telegram)}
                size="icon"
                variant="outline"
                aria-label="Share on Telegram"
              >
                <Send size={16} strokeWidth={2} />
              </Button>
          
              <Button
                onClick={() => openShare(shareLinks.email)}
                size="icon"
                variant="outline"
                aria-label="Share via Email"
              >
                <Mail size={16} strokeWidth={2} />
              </Button>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Input
                  ref={inputRef}
                  id={id}
                  className="pe-9"
                  type="text"
                  defaultValue={shareUrl}
                  aria-label="Share link"
                  readOnly
                />
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleCopy}
                        className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg border border-transparent text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline focus-visible:outline-ring/70 disabled:pointer-events-none"
                        aria-label={copied ? "Copied" : "Copy to clipboard"}
                        disabled={copied}
                      >
                        {copied ? (
                          <Check
                            className="stroke-emerald-500 transition-all"
                            size={16}
                            strokeWidth={2}
                          />
                        ) : (
                          <Copy size={16} strokeWidth={2} />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="px-2 py-1 text-xs">
                      Copy to clipboard
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default ShareModal;
