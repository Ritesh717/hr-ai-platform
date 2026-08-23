"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobTitle: string;
}

export function ApplyDrawer({ open, onOpenChange, jobTitle }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [coverNote, setCoverNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setFile(f);
  }

  async function handleSubmit() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setSubmitting(false);
    setSubmitted(true);
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setFile(null);
      setCoverNote("");
      setSubmitted(false);
    }, 300);
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent side="right" className="flex flex-col gap-6 overflow-y-auto">
        <DrawerTitle className="text-base font-semibold">
          Apply — {jobTitle}
        </DrawerTitle>

        {submitted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <CheckCircle2 className="size-12 text-success" />
            <p className="text-lg font-semibold text-text">Application submitted!</p>
            <p className="text-sm text-text-muted">
              {"We'll"} review your application and be in touch within 5 business days.
            </p>
            <Button intent="secondary" onClick={handleClose}>
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* CV upload */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text">CV / Resume</p>
              <div
                role="button"
                tabIndex={0}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleFile(f);
                }}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
                  dragging ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/50"
                }`}
              >
                <Upload className="size-6 text-text-muted" />
                {file ? (
                  <p className="text-sm font-medium text-text">{file.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-text-muted">
                      Drag & drop your CV here, or{" "}
                      <span className="font-medium text-primary">browse</span>
                    </p>
                    <p className="text-xs text-text-muted">PDF, DOC, or DOCX up to 5MB</p>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>
            </div>

            {/* Cover note */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-text">Cover note</p>
              <Textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Briefly explain why you're a great fit for this role…"
                rows={6}
              />
            </div>

            {/* Submit */}
            <div className="mt-auto flex flex-col gap-2">
              <Button
                intent="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={!file}
              >
                Submit application
              </Button>
              <Button intent="ghost" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
