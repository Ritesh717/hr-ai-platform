import type { Employee } from "@/lib/api/types";

const departments = ["Engineering", "Design", "Sales", "People", "Finance"];
const names = [
  "Carla Sanford", "Miguel Torres", "Aisha Khan", "Devon Park", "Priya Raman",
  "Noah Fischer", "Lena Wolfe", "Tariq Malik", "Isabelle Cho", "Marcus Reed",
  "Sofia Nunez", "Ethan Brooks", "Yuki Tanaka", "Grace Okafor", "Owen Bishop",
  "Nadia Petrov", "Liam Carter", "Ravi Sekar", "Elena Voss", "Jamal Wright",
];

function slug(name: string) {
  return name.toLowerCase().replace(/\s+/g, ".");
}

export const mockEmployees: Employee[] = names.map((name, index) => ({
  id: `emp_${index + 1}`,
  name,
  email: `${slug(name)}@hrai.dev`,
  avatarUrl: null,
  jobTitle: ["Software Engineer", "Product Designer", "Account Executive", "People Partner", "Financial Analyst"][index % 5],
  department: departments[index % departments.length],
  status: index % 7 === 0 ? "on_leave" : "active",
  hireDate: new Date(2019 + (index % 6), index % 12, (index % 27) + 1).toISOString(),
  location: ["Remote", "New York", "Bengaluru", "Berlin", "Toronto"][index % 5],
  bio: "Focused on shipping reliable, well-tested work and mentoring teammates along the way.",
  performanceScore: 60 + ((index * 7) % 40),
}));
