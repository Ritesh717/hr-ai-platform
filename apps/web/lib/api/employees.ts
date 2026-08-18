import type { Employee } from "@/lib/api/types";
import { mockEmployees } from "@/lib/mocks/employees";

const LATENCY_MS = 350;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Mock client for Stage 1's employee API. Swap the bodies below for real
 * `fetch("/api/employees")` calls once the backend endpoint exists — the
 * query/mutation hooks in features/employees/api.ts (and every screen using
 * them) don't need to change.
 */
export async function fetchEmployees(): Promise<Employee[]> {
  await wait(LATENCY_MS);
  return mockEmployees;
}

export async function fetchEmployee(id: string): Promise<Employee> {
  await wait(LATENCY_MS);
  const employee = mockEmployees.find((item) => item.id === id);
  if (!employee) throw new Error(`Employee ${id} not found`);
  return employee;
}

export async function updateEmployee(id: string, patch: Partial<Employee>): Promise<Employee> {
  await wait(LATENCY_MS);
  const employee = mockEmployees.find((item) => item.id === id);
  if (!employee) throw new Error(`Employee ${id} not found`);
  Object.assign(employee, patch);
  return employee;
}
