import { useState } from 'react';
import { Project, createProject, deleteProject, deleteReport, updateProject, updateReport, addReport } from '../lib/storage';

interface ProjectsSidebarProps {
    projects: Project[];
    selectedProjectId: string | null;
    selectedReportId: string | null;
    onSelectProject: (projectId: string) => void;
    onSelectReport: (projectId: string, reportId: string) => void;
    onProjectsChange: () => void;
}

export function ProjectsSidebar({
    projects,
    selectedProjectId,
    selectedReportId,
    onSelectProject,
    onSelectReport,
    onProjectsChange,
}: ProjectsSidebarProps) {
    const [showNewProject, setShowNewProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    // New Report state
    const [addingReportProjectId, setAddingReportProjectId] = useState<string | null>(null);
    const [newReportName, setNewReportName] = useState('');

    // Editing state
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
    const [editingReportId, setEditingReportId] = useState<{ projectId: string, reportId: string } | null>(null);
    const [editName, setEditName] = useState('');

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            createProject(newProjectName.trim());
            setNewProjectName('');
            setShowNewProject(false);
            onProjectsChange();
        }
    };

    const handleCreateReport = (projectId: string) => {
        if (newReportName.trim()) {
            const report = addReport(projectId, newReportName.trim());
            if (report) {
                onProjectsChange();
                onSelectReport(projectId, report.id);
                // Ensure project is expanded (it should be if we are adding report)
                setExpandedProjects(prev => new Set(prev).add(projectId));
            }
            setNewReportName('');
            setAddingReportProjectId(null);
        }
    };

    const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (confirm('Delete this project and all its reports?')) {
            deleteProject(projectId);
            onProjectsChange();
        }
    };

    const handleDeleteReport = (e: React.MouseEvent, projectId: string, reportId: string) => {
        e.stopPropagation();
        if (confirm('Delete this report?')) {
            deleteReport(projectId, reportId);
            onProjectsChange();
        }
    };

    const toggleExpand = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    // Rename handlers
    const startEditProject = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setEditingProjectId(project.id);
        setEditName(project.name);
    };

    const startEditReport = (e: React.MouseEvent, projectId: string, report: { id: string; name: string }) => {
        e.stopPropagation();
        setEditingReportId({ projectId, reportId: report.id });
        setEditName(report.name);
    };

    const saveProjectName = () => {
        if (editingProjectId && editName.trim()) {
            updateProject(editingProjectId, { name: editName.trim() });
            onProjectsChange();
        }
        setEditingProjectId(null);
    };

    const saveReportName = () => {
        if (editingReportId && editName.trim()) {
            updateReport(editingReportId.projectId, editingReportId.reportId, { name: editName.trim() });
            onProjectsChange();
        }
        setEditingReportId(null);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Projects</span>
                <button
                    onClick={() => setShowNewProject(true)}
                    className="text-xs text-white/50 hover:text-white transition-colors"
                    title="New Project"
                >
                    + New
                </button>
            </div>

            {/* New Project Input */}
            {showNewProject && (
                <div className="mb-3 p-2 bg-white/5 rounded-lg">
                    <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name..."
                        className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none mb-2"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleCreateProject}
                            className="flex-1 text-xs bg-white text-black py-1 rounded hover:bg-gray-200 transition-colors"
                        >
                            Create
                        </button>
                        <button
                            onClick={() => { setShowNewProject(false); setNewProjectName(''); }}
                            className="flex-1 text-xs bg-white/10 text-white py-1 rounded hover:bg-white/20 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Projects List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                {projects.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-xs">
                        No projects yet.<br />
                        Click "+ New" to create one.
                    </div>
                ) : (
                    projects.map((project) => (
                        <div key={project.id}>
                            {/* Project Header */}
                            <div
                                onClick={() => {
                                    toggleExpand(project.id);
                                    onSelectProject(project.id);
                                }}
                                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group
                  ${selectedProjectId === project.id ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                `}
                            >
                                <span className="text-xs">{expandedProjects.has(project.id) ? '📂' : '📁'}</span>
                                {editingProjectId === project.id ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onBlur={saveProjectName}
                                        onKeyDown={(e) => e.key === 'Enter' && saveProjectName()}
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex-1 bg-white/10 text-sm text-white px-1 rounded focus:outline-none"
                                        autoFocus
                                    />
                                ) : (
                                    <span
                                        className="flex-1 text-sm truncate"
                                        onDoubleClick={(e) => startEditProject(e, project)}
                                        title="Double-click to rename"
                                    >
                                        {project.name}
                                    </span>
                                )}
                                <span className="text-[10px] text-white/30">{project.reports.length}</span>
                                <button
                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition-opacity"
                                    title="Delete project"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Reports List */}
                            {expandedProjects.has(project.id) && (
                                <div className="ml-4 mt-1 space-y-0.5">
                                    {/* New Report Input */}
                                    {addingReportProjectId === project.id && (
                                        <div className="mb-2 p-1.5 bg-white/5 rounded border border-white/10">
                                            <input
                                                type="text"
                                                value={newReportName}
                                                onChange={(e) => setNewReportName(e.target.value)}
                                                placeholder="Report name..."
                                                className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none mb-1.5"
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreateReport(project.id)}
                                            />
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleCreateReport(project.id)}
                                                    className="flex-1 text-[10px] bg-white text-black py-0.5 rounded hover:bg-gray-200 transition-colors"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    onClick={() => { setAddingReportProjectId(null); setNewReportName(''); }}
                                                    className="flex-1 text-[10px] bg-white/10 text-white py-0.5 rounded hover:bg-white/20 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Add Report Button (only show if not adding) */}
                                    {addingReportProjectId !== project.id && (
                                        <button
                                            onClick={() => {
                                                setAddingReportProjectId(project.id);
                                                setNewReportName('');
                                            }}
                                            className="w-full text-left px-2 py-1 text-xs text-white/30 hover:text-white/60 hover:bg-white/5 rounded transition-colors mb-1"
                                        >
                                            + Add Report
                                        </button>
                                    )}

                                    {project.reports.map((report) => (
                                        <div
                                            key={report.id}
                                            onClick={() => onSelectReport(project.id, report.id)}
                                            className={`
                        flex items-center gap-2 px-2 py-1 rounded cursor-pointer group
                        ${selectedReportId === report.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}
                      `}
                                        >
                                            <span className="text-[10px]">📄</span>
                                            {editingReportId?.reportId === report.id ? (
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onBlur={saveReportName}
                                                    onKeyDown={(e) => e.key === 'Enter' && saveReportName()}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex-1 bg-white/10 text-xs text-white px-1 rounded focus:outline-none"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="flex-1 text-xs truncate"
                                                    onDoubleClick={(e) => startEditReport(e, project.id, report)}
                                                    title="Double-click to rename"
                                                >
                                                    {report.name}
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => handleDeleteReport(e, project.id, report.id)}
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-[10px] transition-opacity"
                                                title="Delete report"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
