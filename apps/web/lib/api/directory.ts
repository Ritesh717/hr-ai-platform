export interface DirectoryEmployee {
  id: string;
  name: string;
  role: string;
  department: string;
  location: string;
  email: string;
  phone: string;
  skills: string[];
}

const FIRST_NAMES = [
  "Alice", "Ben", "Clara", "David", "Eva", "Frank", "Grace", "Hugo",
  "Iris", "Jack", "Kira", "Leo", "Maya", "Noah", "Olivia", "Paul",
  "Quinn", "Rosa", "Sam", "Tara", "Uma", "Victor", "Wendy", "Xander",
  "Yara", "Zach", "Aria", "Blake", "Cleo", "Dylan",
];

const LAST_NAMES = [
  "Anderson", "Brown", "Chen", "Davis", "Evans", "Foster", "Garcia",
  "Harris", "Ivanov", "Johnson", "Kim", "Lee", "Martinez", "Nguyen",
  "Okafor", "Patel", "Quinn", "Rodriguez", "Smith", "Tan",
  "Vance", "Wilson", "Xu", "Yamamoto", "Zhang", "Osei", "Mendes",
  "Nakamura", "Sørensen", "Martín",
];

const DEPT_ROLES: Array<[string, string[]]> = [
  ["Engineering",  ["Software Engineer", "Senior Engineer", "Staff Engineer", "Engineering Manager", "Platform Engineer", "QA Engineer", "DevOps Engineer", "Frontend Engineer", "Backend Engineer"]],
  ["Product",      ["Product Manager", "Senior PM", "Product Lead", "Associate PM", "Growth PM"]],
  ["Design",       ["Product Designer", "UX Researcher", "Design Lead", "Brand Designer", "Motion Designer"]],
  ["Operations",   ["Operations Manager", "Business Analyst", "Project Manager", "Scrum Master", "Program Manager"]],
  ["Marketing",    ["Marketing Manager", "Content Strategist", "Growth Analyst", "Brand Manager", "SEO Specialist"]],
  ["Finance",      ["Financial Analyst", "Accountant", "Finance Manager", "Controller", "FP&A Analyst"]],
  ["HR",           ["HR Business Partner", "Recruiter", "L&D Specialist", "HR Manager", "People Ops"]],
  ["Legal",        ["Legal Counsel", "Compliance Officer", "Contract Manager"]],
];

const DEPT_COUNTS = [45, 20, 12, 18, 15, 12, 15, 13]; // sums to 150

const LOCATIONS = ["Remote", "New York", "London", "Singapore", "Toronto"];

const SKILLS_POOL = [
  "TypeScript", "Python", "React", "Node.js", "GraphQL", "PostgreSQL", "MongoDB",
  "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Figma", "User Research",
  "Product Strategy", "Data Analysis", "SQL", "Machine Learning", "Agile", "Scrum",
  "Jira", "Confluence", "Stakeholder Management", "Content Writing", "SEO",
  "Analytics", "Financial Modeling", "Excel", "Tableau", "Recruiting", "HR Systems",
  "Compliance", "Legal Research", "Brand Strategy", "Motion Design",
];

function lcg(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) & 0x7fffffff;
}

function seededPick<T>(arr: T[], n: number, seed: number): T[] {
  const copy = [...arr];
  let s = Math.abs(seed) || 1;
  for (let i = copy.length - 1; i > 0; i--) {
    s = lcg(s);
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function generate(): DirectoryEmployee[] {
  const employees: DirectoryEmployee[] = [];
  let id = 1;
  for (let di = 0; di < DEPT_ROLES.length; di++) {
    const [dept, roles] = DEPT_ROLES[di];
    const count = DEPT_COUNTS[di];
    for (let i = 0; i < count; i++) {
      const seed = di * 1000 + i + 1;
      let s = lcg(seed);
      const firstName = FIRST_NAMES[s % FIRST_NAMES.length];
      s = lcg(s);
      const lastName = LAST_NAMES[s % LAST_NAMES.length];
      s = lcg(s);
      const role = roles[s % roles.length];
      s = lcg(s);
      const location = LOCATIONS[s % LOCATIONS.length];
      s = lcg(s);
      const skillCount = 3 + (s % 3);
      const skills = seededPick(SKILLS_POOL, skillCount, seed * 17 + di);
      s = lcg(s);
      const areaCode = 200 + (s % 800);
      s = lcg(s);
      const prefix = 200 + (s % 800);
      s = lcg(s);
      const line = 1000 + (s % 9000);
      const emailLocal =
        `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(/[^a-z]/g, "")}` +
        (id > 30 ? String(id) : "");
      employees.push({
        id: `emp-${String(id).padStart(3, "0")}`,
        name: `${firstName} ${lastName}`,
        role,
        department: dept,
        location,
        email: `${emailLocal}@acme.io`,
        phone: `+1 (${areaCode}) ${prefix}-${line}`,
        skills,
      });
      id++;
    }
  }
  return employees;
}

export const DIRECTORY_EMPLOYEES: DirectoryEmployee[] = generate();

export const DIRECTORY_DEPARTMENTS = [...new Set(DIRECTORY_EMPLOYEES.map((e) => e.department))];
export const DIRECTORY_ROLES = [...new Set(DIRECTORY_EMPLOYEES.map((e) => e.role))].sort();
export const DIRECTORY_LOCATIONS = [...new Set(DIRECTORY_EMPLOYEES.map((e) => e.location))].sort();
export const DIRECTORY_SKILLS = [...new Set(DIRECTORY_EMPLOYEES.flatMap((e) => e.skills))].sort();

export async function fetchDirectoryEmployees(): Promise<DirectoryEmployee[]> {
  await new Promise((r) => setTimeout(r, 200));
  return DIRECTORY_EMPLOYEES;
}
