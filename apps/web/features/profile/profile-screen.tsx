"use client";

import {
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Plus,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils/cn";
import { useProfileData } from "@/features/profile/hooks/use-profile-data";
import type { SkillTag } from "@/lib/api/profile";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { AIInsightPanel } from "@/components/patterns/ai-insight-panel";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

// ── Edit schema ───────────────────────────────────────────────────────────────

const editSchema = z.object({
  bio: z.string().min(1, "Bio is required"),
  phone: z.string().optional(),
  location: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

// ── Rating badge tones ────────────────────────────────────────────────────────

const ratingTone = {
  "Exceptional":            "success",
  "Exceeds Expectations":   "success",
  "Meets Expectations":     "info",
  "Needs Improvement":      "warning",
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatPeriod(start: string, end?: string): string {
  const fmt = (ym: string) => {
    const [y, m] = ym.split("-");
    const d = new Date(Number(y), Number(m) - 1);
    return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  };
  return end ? `${fmt(start)} – ${fmt(end)}` : `${fmt(start)} – Present`;
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function ProfileScreen({ canEdit = true }: { canEdit?: boolean }) {
  const push = useToast();
  const { data: currentUser } = useCurrentUser();
  const { data: profile, isLoading } = useProfileData();

  const [skills, setSkills] = useState<SkillTag[] | null>(null);
  const [newSkill, setNewSkill] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [localBio, setLocalBio] = useState<string | null>(null);
  const [localPhone, setLocalPhone] = useState<string | null>(null);
  const [localLocation, setLocalLocation] = useState<string | null>(null);

  const displaySkills = skills ?? profile?.skills ?? [];
  const displayBio = localBio ?? profile?.bio;
  const displayPhone = localPhone ?? profile?.phone;
  const displayLocation = localLocation ?? profile?.location;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  function openEdit() {
    reset({ bio: displayBio ?? "", phone: displayPhone ?? "", location: displayLocation ?? "" });
    setEditOpen(true);
  }

  async function onEditSubmit(values: EditValues) {
    await new Promise((r) => setTimeout(r, 300));
    setLocalBio(values.bio);
    setLocalPhone(values.phone ?? null);
    setLocalLocation(values.location ?? null);
    setEditOpen(false);
    push({ title: "Profile saved", tone: "success" });
  }

  function addSkill() {
    const label = newSkill.trim();
    if (!label) return;
    const existing = displaySkills.some((s) => s.label.toLowerCase() === label.toLowerCase());
    if (existing) { setNewSkill(""); return; }
    setSkills([...displaySkills, { id: `skill-${Date.now()}`, label }]);
    setNewSkill("");
  }

  function removeSkill(id: string) {
    setSkills(displaySkills.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        {/* Identity hero */}
        <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
          {isLoading ? (
            <div className="flex items-start gap-4">
              <Skeleton className="size-24 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ) : (
            <>
              <Avatar name={currentUser?.name ?? "User"} size="xl" className="shrink-0" />
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-page-title">{currentUser?.name}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        Senior Software Engineer
                      </span>
                      <span className="rounded-full bg-chip px-2.5 py-0.5 text-xs font-medium text-text-muted">
                        Platform Engineering
                      </span>
                    </div>
                  </div>
                  {canEdit && (
                    <Button intent="secondary" size="sm" onClick={openEdit}>
                      <User className="mr-2 size-4" />
                      Edit profile
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-text-muted">
                  <div className="flex items-center gap-1.5">
                    <Mail className="size-3.5 shrink-0" />
                    <span>{currentUser?.email ?? "—"}</span>
                  </div>
                  {displayPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5 shrink-0" />
                      <span>{displayPhone}</span>
                    </div>
                  )}
                  {displayLocation && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      <span>{displayLocation}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </Card>

        {/* About & skills */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-section-heading">About</h2>
          {isLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <p className="text-sm text-text-muted">{displayBio}</p>
          )}

          <h2 className="text-section-heading">Skills</h2>
          {isLoading ? (
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {displaySkills.map((skill) => (
                <span
                  key={skill.id}
                  className="group flex items-center gap-1 rounded-full bg-chip px-3 py-1 text-xs font-medium text-text"
                >
                  {skill.label}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => removeSkill(skill.id)}
                      className="ml-0.5 rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-border"
                      aria-label={`Remove ${skill.label}`}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </span>
              ))}
              {canEdit && (
                <div className="flex items-center gap-1">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="Add skill…"
                    className="h-7 w-28 rounded-full px-3 text-xs"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="flex size-7 items-center justify-center rounded-full border border-dashed border-border text-text-muted hover:border-primary hover:text-primary"
                    aria-label="Add skill"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Employment history timeline */}
        <Card className="flex flex-col gap-4 p-5">
          <h2 className="text-section-heading">Employment history</h2>
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="size-3 mt-1.5 shrink-0 rounded-full" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="relative flex flex-col gap-6">
              {/* Vertical line */}
              <div className="absolute left-[5px] top-2 bottom-2 w-px bg-border" />
              {profile?.timeline.map((entry) => (
                <div key={entry.id} className="flex gap-4">
                  {/* Dot */}
                  <div className={cn(
                    "relative mt-1 size-3 shrink-0 rounded-full border-2",
                    entry.endDate
                      ? "border-border bg-bg"
                      : "border-primary bg-primary",
                  )} />
                  <div className="flex flex-col gap-1 pb-2">
                    <p className="font-semibold text-text">{entry.role}</p>
                    <p className="text-xs text-text-muted">
                      {entry.department} · {formatPeriod(entry.startDate, entry.endDate)}
                    </p>
                    <p className="text-sm text-text-muted">{entry.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Performance summary */}
        <Card className="flex flex-col gap-4 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-section-heading">Performance</h2>
            {profile && !isLoading && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">{profile.performance.cycle}</span>
                <Badge tone={ratingTone[profile.performance.rating] as "success" | "info" | "warning"}>
                  {profile.performance.rating}
                </Badge>
              </div>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : profile ? (
            <div className="flex flex-col gap-4">
              <ul className="flex flex-col gap-2">
                {profile.performance.achievements.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    {a}
                  </li>
                ))}
              </ul>
              <div className="rounded-lg border border-border bg-bg p-4 text-sm text-text-muted">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-subtle">
                  Manager comment
                </p>
                <p>{profile.performance.managerComment}</p>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      {/* AI insight rail */}
      <div className="w-full shrink-0 lg:w-[280px]">
        <AIInsightPanel context="profile" variant="rail" />
      </div>

      {/* Edit profile dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogTitle>Edit profile</DialogTitle>
          <form onSubmit={handleSubmit(onEditSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" rows={4} {...register("bio")} />
              {errors.bio && <p className="text-xs text-danger">{errors.bio.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+44 …" {...register("phone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="City, Country" {...register("location")} />
            </div>
            <DialogFooter>
              <Button type="button" intent="secondary" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" intent="primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
