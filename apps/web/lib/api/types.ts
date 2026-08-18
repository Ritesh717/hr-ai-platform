/**
 * Mirrors the shape Stage 1's employee domain module (domain/employee) will expose
 * over /api/employees once the backend lands — see ui-plan.md §6 (F1 pairs with Stage 1).
 */
export interface Employee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  jobTitle: string;
  department: string;
  status: "active" | "on_leave" | "terminated";
  hireDate: string; // ISO date
  location: string;
  bio?: string;
  performanceScore: number; // 0-100
}
