"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Shield, Eye, Bot, Palette } from "lucide-react";
import {
  fetchActiveSessions,
  loadPreferences,
  savePreferences,
} from "@/lib/api/settings";
import type { UserPreferences } from "@/lib/api/settings";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Helpers ───────────────────────────────────────────────────────────────────

function applyTheme(theme: UserPreferences["theme"]) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

function applyFontSize(size: UserPreferences["fontSize"]) {
  if (typeof document === "undefined") return;
  const map = { default: "16px", large: "18px", "x-large": "20px" } as const;
  document.documentElement.style.setProperty("--font-size-base", map[size]);
}

function fmtRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

// ── Settings section wrapper ──────────────────────────────────────────────────

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-border last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text">{label}</p>
        {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

function AppearanceTab({ prefs, onChange }: { prefs: UserPreferences; onChange: (p: Partial<UserPreferences>) => void }) {
  return (
    <Card>
      <CardContent className="pt-0 divide-y divide-border">
        <SettingRow label="Theme" description="Choose your preferred colour scheme">
          <RadioGroup
            value={prefs.theme}
            onValueChange={(v) => {
              onChange({ theme: v as UserPreferences["theme"] });
              applyTheme(v as UserPreferences["theme"]);
            }}
            className="flex gap-3"
          >
            {(["light", "dark", "system"] as const).map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-1.5 text-sm text-text capitalize">
                <RadioGroupItem value={t} />
                {t}
              </label>
            ))}
          </RadioGroup>
        </SettingRow>

        <SettingRow label="Density" description="Adjust spacing across the interface">
          <RadioGroup
            value={prefs.density}
            onValueChange={(v) => onChange({ density: v as UserPreferences["density"] })}
            className="flex gap-3"
          >
            {(["comfortable", "compact"] as const).map((d) => (
              <label key={d} className="flex cursor-pointer items-center gap-1.5 text-sm text-text capitalize">
                <RadioGroupItem value={d} />
                {d}
              </label>
            ))}
          </RadioGroup>
        </SettingRow>

        <SettingRow label="Language">
          <Select value={prefs.language} onValueChange={(v) => onChange({ language: v })}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr" disabled>French (coming soon)</SelectItem>
              <SelectItem value="de" disabled>German (coming soon)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </CardContent>
    </Card>
  );
}

function AIBehaviorTab({ prefs, onChange }: { prefs: UserPreferences; onChange: (p: Partial<UserPreferences>) => void }) {
  const [clearOpen, setClearOpen] = useState(false);
  return (
    <Card>
      <CardContent className="pt-0 divide-y divide-border">
        <SettingRow label="Response verbosity" description="How much context the AI includes in responses">
          <RadioGroup
            value={prefs.aiVerbosity}
            onValueChange={(v) => onChange({ aiVerbosity: v as UserPreferences["aiVerbosity"] })}
            className="flex gap-3"
          >
            {(["concise", "balanced", "detailed"] as const).map((v) => (
              <label key={v} className="flex cursor-pointer items-center gap-1.5 text-sm text-text capitalize">
                <RadioGroupItem value={v} />
                {v}
              </label>
            ))}
          </RadioGroup>
        </SettingRow>

        <SettingRow label="Preferred AI model">
          <Select value={prefs.aiModel} onValueChange={(v) => onChange({ aiModel: v as UserPreferences["aiModel"] })}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="fast">Fast</SelectItem>
              <SelectItem value="precise">Precise</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label="Anonymized usage data"
          description="Allow your anonymized usage data to improve AI suggestions. No personal or HR content is shared."
        >
          <Switch
            checked={prefs.dataSharing}
            onCheckedChange={(v) => onChange({ dataSharing: v })}
            aria-label="Allow data sharing"
          />
        </SettingRow>

        <SettingRow label="Clear conversation history" description="Removes all past AI chat messages">
          <Button intent="destructive" size="sm" onClick={() => setClearOpen(true)}>
            Clear history
          </Button>
        </SettingRow>
      </CardContent>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear conversation history?"
        description="This will permanently delete all past AI conversations. This cannot be undone."
        confirmLabel="Clear history"
        intent="destructive"
        onConfirm={() => {}}
      />
    </Card>
  );
}

function SecurityTab() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["active-sessions"],
    queryFn: fetchActiveSessions,
    staleTime: 60_000,
  });
  const [revoked, setRevoked] = useState<Set<string>>(new Set());
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  const visible = sessions.filter((s) => !revoked.has(s.id));

  function handleChangePassword() {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError("All fields are required.");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError("New password and confirmation do not match.");
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    setPwError("");
    setPwSuccess(true);
    setPwForm({ current: "", next: "", confirm: "" });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Active sessions */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="mb-4 text-sm font-semibold text-text">Active sessions</h3>
          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-lg" />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {visible.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm text-text flex items-center gap-2">
                      {s.device}
                      {s.isCurrent && <Badge tone="success">Current</Badge>}
                    </p>
                    <p className="text-xs text-text-muted">{s.location} · {fmtRelative(s.lastActive)}</p>
                  </div>
                  {!s.isCurrent && (
                    <Button intent="secondary" size="sm" onClick={() => setRevoked((prev) => new Set([...prev, s.id]))}>
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* MFA */}
      <Card>
        <CardContent className="flex items-center justify-between gap-3 pt-5">
          <div>
            <p className="text-sm font-medium text-text">Multi-factor authentication</p>
            <p className="mt-0.5 text-xs text-text-muted">Add an extra layer of security to your account</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge tone="neutral">Not enabled</Badge>
            <Button intent="secondary" size="sm">Enable MFA</Button>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="mb-4 text-sm font-semibold text-text">Change password</h3>
          <div className="flex flex-col gap-3 max-w-sm">
            <Input
              type="password"
              placeholder="Current password"
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
              aria-label="Current password"
            />
            <Input
              type="password"
              placeholder="New password"
              value={pwForm.next}
              onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
              aria-label="New password"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              aria-label="Confirm new password"
            />
            {pwError && <p className="text-xs text-danger">{pwError}</p>}
            {pwSuccess && <p className="text-xs text-success">Password changed successfully.</p>}
            <Button intent="primary" size="sm" onClick={handleChangePassword}>
              Update password
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessibilityTab({ prefs, onChange }: { prefs: UserPreferences; onChange: (p: Partial<UserPreferences>) => void }) {
  return (
    <Card>
      <CardContent className="pt-0 divide-y divide-border">
        <SettingRow
          label="Reduced motion"
          description="Disables animations and transitions across the interface"
        >
          <Switch
            checked={prefs.reducedMotion}
            onCheckedChange={(v) => onChange({ reducedMotion: v })}
            aria-label="Enable reduced motion"
          />
        </SettingRow>

        <SettingRow label="Font size" description="Adjusts the base text size across the app">
          <RadioGroup
            value={prefs.fontSize}
            onValueChange={(v) => {
              onChange({ fontSize: v as UserPreferences["fontSize"] });
              applyFontSize(v as UserPreferences["fontSize"]);
            }}
            className="flex gap-3"
          >
            {([["default", "Default"], ["large", "Large"], ["x-large", "X-Large"]] as const).map(([val, label]) => (
              <label key={val} className="flex cursor-pointer items-center gap-1.5 text-sm text-text">
                <RadioGroupItem value={val} />
                {label}
              </label>
            ))}
          </RadioGroup>
        </SettingRow>

        <SettingRow
          label="Enhanced focus indicators"
          description="Always-visible focus rings (not only on keyboard navigation)"
        >
          <Switch
            checked={prefs.enhancedFocus}
            onCheckedChange={(v) => onChange({ enhancedFocus: v })}
            aria-label="Enhanced focus indicators"
          />
        </SettingRow>
      </CardContent>
    </Card>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export function SettingsScreen() {
  const [prefs, setPrefs] = useState(() => loadPreferences());

  useEffect(() => {
    applyTheme(prefs.theme);
    applyFontSize(prefs.fontSize);
  }, []);

  function handleChange(partial: Partial<UserPreferences>) {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      savePreferences(partial);
      return next;
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title="Settings" description="Manage your preferences and account settings" />

      <Tabs defaultValue="appearance">
        <TabsList className="mb-6">
          <TabsTrigger value="appearance">
            <Palette className="size-3.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Bot className="size-3.5" />
            AI Behavior
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="size-3.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="accessibility">
            <Eye className="size-3.5" />
            Accessibility
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance">
          <AppearanceTab prefs={prefs} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="ai">
          <AIBehaviorTab prefs={prefs} onChange={handleChange} />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="accessibility">
          <AccessibilityTab prefs={prefs} onChange={handleChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
