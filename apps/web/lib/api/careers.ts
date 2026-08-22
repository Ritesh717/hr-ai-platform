export interface CareerRole {
  id: string;
  title: string;
  department: string;
  /** ISO date string; omitted for projected future roles */
  startDate?: string;
  /** ISO date string; omit for current/future roles */
  endDate?: string;
  /** Estimated months until next step; only for future roles */
  estimatedMonths?: number;
  kind: "past" | "current" | "projected";
}

export interface SkillPoint {
  skill: string;
  current: number;
  target: number;
}

export interface CareerData {
  journey: CareerRole[];
  skills: SkillPoint[];
  targetRole: string;
}

export async function fetchCareerData(): Promise<CareerData> {
  await new Promise((r) => setTimeout(r, 200));
  return {
    targetRole: "Senior Software Engineer",
    journey: [
      {
        id: "r1",
        title: "Junior Developer",
        department: "Engineering",
        startDate: "2021-03-01",
        endDate: "2022-08-31",
        kind: "past",
      },
      {
        id: "r2",
        title: "Software Engineer",
        department: "Engineering",
        startDate: "2022-09-01",
        endDate: "2024-02-28",
        kind: "past",
      },
      {
        id: "r3",
        title: "Software Engineer II",
        department: "Engineering",
        startDate: "2024-03-01",
        kind: "current",
      },
      {
        id: "r4",
        title: "Senior Software Engineer",
        department: "Engineering",
        estimatedMonths: 8,
        kind: "projected",
      },
      {
        id: "r5",
        title: "Staff Engineer",
        department: "Engineering",
        estimatedMonths: 24,
        kind: "projected",
      },
    ],
    skills: [
      { skill: "TypeScript",     current: 88, target: 80 },
      { skill: "System Design",  current: 60, target: 90 },
      { skill: "AWS",            current: 55, target: 80 },
      { skill: "Leadership",     current: 70, target: 75 },
      { skill: "Communication",  current: 82, target: 75 },
      { skill: "Data Analysis",  current: 65, target: 70 },
    ],
  };
}
