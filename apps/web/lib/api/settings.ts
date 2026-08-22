export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  density: "comfortable" | "compact";
  language: string;
  aiVerbosity: "concise" | "balanced" | "detailed";
  aiModel: "auto" | "fast" | "precise";
  dataSharing: boolean;
  reducedMotion: boolean;
  fontSize: "default" | "large" | "x-large";
  enhancedFocus: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "system",
  density: "comfortable",
  language: "en",
  aiVerbosity: "balanced",
  aiModel: "auto",
  dataSharing: true,
  reducedMotion: false,
  fontSize: "default",
  enhancedFocus: false,
};

const PREF_STORAGE_KEY = "hr-ai:user-preferences";

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREF_STORAGE_KEY);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Partial<UserPreferences>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadPreferences();
    localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify({ ...current, ...prefs }));
  } catch {
    // localStorage may be unavailable in some contexts
  }
}

export async function fetchActiveSessions(): Promise<ActiveSession[]> {
  await new Promise((r) => setTimeout(r, 150));
  return [
    {
      id: "s1",
      device: "Chrome on macOS",
      location: "London, UK",
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
    {
      id: "s2",
      device: "Safari on iPhone 15",
      location: "London, UK",
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isCurrent: false,
    },
    {
      id: "s3",
      device: "Firefox on Windows",
      location: "Manchester, UK",
      lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      isCurrent: false,
    },
  ];
}
