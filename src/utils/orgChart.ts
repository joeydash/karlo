import { Member } from '../types/member';

export interface OrgChartNode {
  name: string;
  attributes?: {
    designation?: string;
    role?: string;
    joining_date?: string;
    id?: string;
    isOrganization?: boolean;
    memberCount?: number;
    hierarchyCount?: number;
  };
  children?: OrgChartNode[];
}

export interface MemberNode extends Member {
  mentees: MemberNode[];
}

export interface OrgTreeResult {
  allRoots: MemberNode[];
  founders: MemberNode[];
  unassigned: MemberNode[];
}

export function buildOrgTrees(members: Member[]): OrgTreeResult {
  const map = new Map<string, MemberNode>();
  const roots: MemberNode[] = [];

  // Initialize map with all members
  members.forEach(member => {
    map.set(member.id, { ...member, mentees: [] });
  });

  // Build hierarchy by linking mentors and mentees
  members.forEach(member => {
    const node = map.get(member.id)!;
    if (member.mentor_id && map.has(member.mentor_id)) {
      // Has a valid mentor - add as mentee
      map.get(member.mentor_id)!.mentees.push(node);
    } else {
      // No mentor or mentor doesn't exist - treat as root
      roots.push(node);
    }
  });

  // Categorize roots
  const ids = new Set(members.map(m => m.id));
  const founders: MemberNode[] = [];
  const unassigned: MemberNode[] = [];

  roots.forEach(root => {
    if (root.mentor_id === null || root.mentor_id === undefined) {
      // No mentor assigned
      if (root.mentees.length > 0) {
        // Has mentees - true founder/head
        founders.push(root);
      } else {
        // No mentees - unassigned member
        unassigned.push(root);
      }
    } else if (!ids.has(root.mentor_id)) {
      // Has mentor_id but mentor doesn't exist in organization
      unassigned.push(root);
    }
  });

  return {
    allRoots: roots,
    founders,
    unassigned
  };
}

export function convertToD3TreeFormat(node: MemberNode): OrgChartNode {
  return {
    name: node.auth_fullname.fullname || 'Unknown',
    attributes: {
      designation: node.designation || 'No designation',
      role: node.role,
      joining_date: node.joining_date
        ? new Date(node.joining_date).toLocaleDateString()
        : undefined,
      id: node.id,
    },
    children: node.mentees.length > 0
      ? node.mentees.map(convertToD3TreeFormat)
      : undefined,
  };
}

export function optimizeTreeLayout(tree: OrgChartNode): OrgChartNode {
  // Clone the tree to avoid mutating the original
  const optimizedTree = JSON.parse(JSON.stringify(tree));
  
  // Apply optimization strategies
  return applyTreeOptimizations(optimizedTree);
}

function applyTreeOptimizations(node: OrgChartNode): OrgChartNode {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  // For large teams, we can implement strategies like:
  // 1. Limit the depth displayed initially
  // 2. Group large teams under "Team Lead" nodes
  // 3. Implement virtual scrolling for very large trees
  
  // Currently, we'll just ensure the tree structure is clean
  const optimizedChildren = node.children.map(child => 
    applyTreeOptimizations(child)
  );

  return {
    ...node,
    children: optimizedChildren
  };
}

export function calculateTreeSize(node: OrgChartNode): { width: number; height: number } {
  if (!node.children || node.children.length === 0) {
    return { width: 1, height: 1 };
  }

  const childSizes = node.children.map(calculateTreeSize);
  const maxHeight = Math.max(...childSizes.map(size => size.height)) + 1;
  const totalWidth = childSizes.reduce((sum, size) => sum + size.width, 0);

  return {
    width: Math.max(1, totalWidth),
    height: maxHeight
  };
}

export function findMemberInTree(
  nodes: OrgChartNode[],
  memberId: string
): OrgChartNode | null {
  for (const node of nodes) {
    if (node.attributes?.id === memberId) {
      return node;
    }
    if (node.children) {
      const found = findMemberInTree(node.children, memberId);
      if (found) return found;
    }
  }
  return null;
}