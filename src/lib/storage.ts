export interface Report {
    id: string;
    name: string;
    type: 'report';
    findings: string;
    markdown: string;
    mode?: string; // 'standard' | 'hackerone'
    createdAt: number;
    updatedAt: number;
}

export interface Folder {
    id: string;
    name: string;
    type: 'folder';
    children: FileSystemItem[];
    createdAt: number;
    updatedAt: number;
}

export type FileSystemItem = Report | Folder;

export interface Project {
    id: string;
    name: string;
    description?: string;
    items: FileSystemItem[];
    createdAt: number;
    updatedAt: number;
}

// Storage keys
const PROJECTS_KEY = 'ai-reporter-projects';
const SETTINGS_KEY = 'ai-reporter-settings';

// Generate unique ID
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Migration: Convert old 'reports' array to new 'items' structure
function migrateProject(project: any): Project {
    if (project.items) return project as Project;

    // Migrate old reports to new items format
    const reports = project.reports || [];
    const items: FileSystemItem[] = reports.map((r: any) => ({
        ...r,
        type: 'report' as const,
    }));

    return {
        id: project.id,
        name: project.name,
        description: project.description,
        items,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    };
}

// Projects CRUD operations
export function getProjects(): Project[] {
    const data = localStorage.getItem(PROJECTS_KEY);
    if (!data) return [];

    const rawProjects = JSON.parse(data);
    return rawProjects.map(migrateProject);
}

export function saveProjects(projects: Project[]): void {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function createProject(name: string, description?: string): Project {
    const project: Project = {
        id: generateId(),
        name,
        description,
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    const projects = getProjects();
    projects.unshift(project);
    saveProjects(projects);

    return project;
}

export function deleteProject(projectId: string): void {
    const projects = getProjects().filter(p => p.id !== projectId);
    saveProjects(projects);
}

export function updateProject(projectId: string, updates: Partial<Pick<Project, 'name' | 'description'>>): Project | null {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === projectId);

    if (index === -1) return null;

    projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: Date.now(),
    };

    saveProjects(projects);
    return projects[index];
}

// Recursive helper: Find item in tree
function findItemInTree(items: FileSystemItem[], itemId: string): FileSystemItem | null {
    for (const item of items) {
        if (item.id === itemId) return item;
        if (item.type === 'folder') {
            const found = findItemInTree(item.children, itemId);
            if (found) return found;
        }
    }
    return null;
}


// Recursive helper: Delete item from tree
function deleteFromTree(items: FileSystemItem[], itemId: string): FileSystemItem[] {
    return items.filter(item => {
        if (item.id === itemId) return false;
        if (item.type === 'folder') {
            item.children = deleteFromTree(item.children, itemId);
        }
        return true;
    });
}

// Recursive helper: Update item in tree
function updateInTree(items: FileSystemItem[], itemId: string, updates: Partial<Report | Folder>): boolean {
    for (let i = 0; i < items.length; i++) {
        if (items[i].id === itemId) {
            items[i] = { ...items[i], ...updates, updatedAt: Date.now() } as FileSystemItem;
            return true;
        }
        if (items[i].type === 'folder') {
            if (updateInTree((items[i] as Folder).children, itemId, updates)) return true;
        }
    }
    return false;
}

// Add report to project (at root or inside a folder)
export function addReport(projectId: string, name: string, parentFolderId: string | null = null, findings: string = '', markdown: string = '', mode: string = 'standard'): Report | null {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const report: Report = {
        id: generateId(),
        name,
        type: 'report',
        findings,
        markdown,
        mode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    if (parentFolderId) {
        const folder = findItemInTree(project.items, parentFolderId);
        if (folder && folder.type === 'folder') {
            folder.children.unshift(report);
        } else {
            return null; // Parent folder not found
        }
    } else {
        project.items.unshift(report);
    }

    project.updatedAt = Date.now();
    saveProjects(projects);
    return report;
}

// Create folder
export function createFolder(projectId: string, name: string, parentFolderId: string | null = null): Folder | null {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const folder: Folder = {
        id: generateId(),
        name,
        type: 'folder',
        children: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    if (parentFolderId) {
        const parentFolder = findItemInTree(project.items, parentFolderId);
        if (parentFolder && parentFolder.type === 'folder') {
            parentFolder.children.unshift(folder);
        } else {
            return null;
        }
    } else {
        project.items.unshift(folder);
    }

    project.updatedAt = Date.now();
    saveProjects(projects);
    return folder;
}

// Update report
export function updateReport(projectId: string, reportId: string, updates: Partial<Pick<Report, 'name' | 'findings' | 'markdown' | 'mode'>>): Report | null {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    if (updateInTree(project.items, reportId, updates)) {
        project.updatedAt = Date.now();
        saveProjects(projects);
        const item = findItemInTree(project.items, reportId);
        return item?.type === 'report' ? item : null;
    }
    return null;
}

// Update folder
export function updateFolder(projectId: string, folderId: string, updates: Partial<Pick<Folder, 'name'>>): Folder | null {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    if (updateInTree(project.items, folderId, updates)) {
        project.updatedAt = Date.now();
        saveProjects(projects);
        const item = findItemInTree(project.items, folderId);
        return item?.type === 'folder' ? item : null;
    }
    return null;
}

// Delete item (report or folder)
export function deleteItem(projectId: string, itemId: string): void {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    project.items = deleteFromTree(project.items, itemId);
    project.updatedAt = Date.now();
    saveProjects(projects);
}

// Legacy: Delete report (for backward compatibility)
export function deleteReport(projectId: string, reportId: string): void {
    deleteItem(projectId, reportId);
}

// Find report in project
export function findReport(projectId: string, reportId: string): Report | null {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;

    const item = findItemInTree(project.items, reportId);
    return item?.type === 'report' ? item : null;
}

// Get all reports from a project (flat list, for compatibility)
export function getAllReports(project: Project): Report[] {
    const reports: Report[] = [];

    function collectReports(items: FileSystemItem[]) {
        for (const item of items) {
            if (item.type === 'report') {
                reports.push(item);
            } else if (item.type === 'folder') {
                collectReports(item.children);
            }
        }
    }

    collectReports(project.items);
    return reports;
}

// Settings
export interface Settings {
    apiKey?: string;
    theme: 'dark' | 'light';
    defaultProjectId?: string;
    temperature: number;
    model: string;
    accentColor: string;
}

export function getSettings(): Settings {
    const data = localStorage.getItem(SETTINGS_KEY);
    const defaults: Settings = { theme: 'dark', temperature: 0.3, model: 'gemini-2.5-flash', accentColor: '#4ade80' };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
}

export function saveSettings(settings: Settings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
