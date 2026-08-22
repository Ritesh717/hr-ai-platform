export interface OrgNode {
  id: string;
  name: string;
  role: string;
  department: string;
  managerId: string | null;
  presence: "online" | "offline";
}

export const ORG_NODES: OrgNode[] = [
  // Level 0
  { id: "n0",  name: "Sarah Chen",        role: "Chief Executive Officer", department: "Executive",   managerId: null,  presence: "online"  },
  // Level 1
  { id: "n1",  name: "Alex Kim",           role: "Chief Technology Officer", department: "Engineering", managerId: "n0", presence: "online"  },
  { id: "n2",  name: "Maria Santos",       role: "Chief Product Officer",    department: "Product",     managerId: "n0", presence: "online"  },
  { id: "n3",  name: "James Lee",          role: "Chief Design Officer",     department: "Design",      managerId: "n0", presence: "offline" },
  { id: "n4",  name: "Emma Wilson",        role: "Chief Operating Officer",  department: "Operations",  managerId: "n0", presence: "online"  },
  // Level 2
  { id: "n5",  name: "Tom Baker",          role: "Backend Eng Director",     department: "Engineering", managerId: "n1", presence: "online"  },
  { id: "n6",  name: "Lisa Park",          role: "Frontend Eng Director",    department: "Engineering", managerId: "n1", presence: "online"  },
  { id: "n7",  name: "Chris Morgan",       role: "Product Director",         department: "Product",     managerId: "n2", presence: "offline" },
  { id: "n8",  name: "Anna Kowalski",      role: "Product Director",         department: "Product",     managerId: "n2", presence: "online"  },
  { id: "n9",  name: "David Osei",         role: "Design Director",          department: "Design",      managerId: "n3", presence: "online"  },
  { id: "n10", name: "Maya Patel",         role: "Research Director",        department: "Design",      managerId: "n3", presence: "offline" },
  { id: "n11", name: "Kevin Zhang",        role: "HR Director",              department: "Operations",  managerId: "n4", presence: "online"  },
  { id: "n12", name: "Rachel Brown",       role: "Finance Director",         department: "Operations",  managerId: "n4", presence: "online"  },
  // Level 3
  { id: "n13", name: "Ben Osei",           role: "Backend Lead",             department: "Engineering", managerId: "n5", presence: "online"  },
  { id: "n14", name: "Sophie Lin",         role: "Backend Lead",             department: "Engineering", managerId: "n5", presence: "offline" },
  { id: "n15", name: "Jake Torres",        role: "Frontend Lead",            department: "Engineering", managerId: "n6", presence: "online"  },
  { id: "n16", name: "Nia Owusu",          role: "PM Lead",                  department: "Product",     managerId: "n7", presence: "online"  },
  { id: "n17", name: "Marcus Chen",        role: "PM Lead",                  department: "Product",     managerId: "n8", presence: "offline" },
  { id: "n18", name: "Amara Diop",         role: "Design Lead",              department: "Design",      managerId: "n9", presence: "online"  },
  { id: "n19", name: "Lucas Mendez",       role: "Research Lead",            department: "Design",      managerId: "n10", presence: "online" },
  { id: "n20", name: "Priya Sharma",       role: "HR Lead",                  department: "Operations",  managerId: "n11", presence: "online" },
  { id: "n21", name: "Fatima Al-Rashid",   role: "Finance Lead",             department: "Operations",  managerId: "n12", presence: "offline"},
  // Level 4
  { id: "n22", name: "Ethan Cole",         role: "Sr Backend Engineer",      department: "Engineering", managerId: "n13", presence: "online" },
  { id: "n23", name: "Olivia Nakamura",    role: "Sr Backend Engineer",      department: "Engineering", managerId: "n14", presence: "offline"},
  { id: "n24", name: "Ryan Patel",         role: "Sr Frontend Engineer",     department: "Engineering", managerId: "n15", presence: "online" },
  { id: "n25", name: "Carlos Vega",        role: "Product Manager",          department: "Product",     managerId: "n16", presence: "online" },
];

export const DEPARTMENTS = [...new Set(ORG_NODES.map((n) => n.department))];

export async function fetchOrgNodes(): Promise<OrgNode[]> {
  await new Promise((r) => setTimeout(r, 200));
  return ORG_NODES;
}
