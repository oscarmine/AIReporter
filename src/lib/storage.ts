// Project and Report data types
export interface Report {
    id: string;
    name: string;
    findings: string;
    markdown: string;
    createdAt: number;
    updatedAt: number;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    reports: Report[];
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

// Projects CRUD operations
export function getProjects(): Project[] {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
}

export function saveProjects(projects: Project[]): void {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function createProject(name: string, description?: string): Project {
    const project: Project = {
        id: generateId(),
        name,
        description,
        reports: [],
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

// Report CRUD operations within a project
export function addReport(projectId: string, name: string, findings: string = '', markdown: string = ''): Report | null {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) return null;

    const report: Report = {
        id: generateId(),
        name,
        findings,
        markdown,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    project.reports.unshift(report);
    project.updatedAt = Date.now();
    saveProjects(projects);

    return report;
}

export function updateReport(projectId: string, reportId: string, updates: Partial<Pick<Report, 'name' | 'findings' | 'markdown'>>): Report | null {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) return null;

    const reportIndex = project.reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) return null;

    project.reports[reportIndex] = {
        ...project.reports[reportIndex],
        ...updates,
        updatedAt: Date.now(),
    };

    project.updatedAt = Date.now();
    saveProjects(projects);

    return project.reports[reportIndex];
}

export function deleteReport(projectId: string, reportId: string): void {
    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) return;

    project.reports = project.reports.filter(r => r.id !== reportId);
    project.updatedAt = Date.now();
    saveProjects(projects);
}

// Settings
export interface Settings {
    apiKey?: string;
    theme: 'dark' | 'light';
    defaultProjectId?: string;
    temperature: number;
    model: string;
}

export function getSettings(): Settings {
    const data = localStorage.getItem(SETTINGS_KEY);
    const defaults: Settings = { theme: 'dark', temperature: 0.3, model: 'gemini-2.5-flash' };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
}

export function saveSettings(settings: Settings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
