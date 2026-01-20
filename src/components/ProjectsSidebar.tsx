import { useState } from 'react';
import { Project, FileSystemItem, Folder, Report, createProject, deleteProject, deleteItem, updateProject, updateReport, updateFolder, addReport, createFolder } from '../lib/storage';
import { ContextMenu, ContextMenuItem } from './ContextMenu';
import { ConfirmDialog } from './ConfirmDialog';

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
    selectedReportId,
    onSelectReport,
    onProjectsChange,
}: ProjectsSidebarProps) {
    const [showNewProject, setShowNewProject] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [closingItems, setClosingItems] = useState<Set<string>>(new Set());

    // New item state
    const [addingTo, setAddingTo] = useState<{ projectId: string; parentId: string | null; type: 'report' | 'folder' } | null>(null);
    const [newItemName, setNewItemName] = useState('');

    // Editing state
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        items: ContextMenuItem[];
    } | null>(null);

    // Confirm dialog state
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    } | null>(null);

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            createProject(newProjectName.trim());
            setNewProjectName('');
            setShowNewProject(false);
            onProjectsChange();
        }
    };

    const handleCreateItem = (projectId: string) => {
        if (!addingTo || !newItemName.trim()) return;

        if (addingTo.type === 'report') {
            const report = addReport(projectId, newItemName.trim(), addingTo.parentId);
            if (report) {
                onProjectsChange();
                onSelectReport(projectId, report.id);
            }
        } else {
            const folder = createFolder(projectId, newItemName.trim(), addingTo.parentId);
            if (folder) {
                onProjectsChange();
                setExpandedItems(prev => new Set(prev).add(folder.id));
            }
        }

        setNewItemName('');
        setAddingTo(null);
    };

    const toggleExpand = (itemId: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemId)) {
            // Start closing animation
            setClosingItems(prev => new Set(prev).add(itemId));
            // After animation, actually collapse
            setTimeout(() => {
                setExpandedItems(prev => {
                    const next = new Set(prev);
                    next.delete(itemId);
                    return next;
                });
                setClosingItems(prev => {
                    const next = new Set(prev);
                    next.delete(itemId);
                    return next;
                });
            }, 100); // Match animation duration
        } else {
            newExpanded.add(itemId);
            setExpandedItems(newExpanded);
        }
    };

    // Rename handlers
    const startEditItem = (itemId: string, name: string, isProject: boolean = false) => {
        if (isProject) {
            setEditingProjectId(itemId);
        } else {
            setEditingItemId(itemId);
        }
        setEditName(name);
    };

    const saveItemName = (projectId: string, item: FileSystemItem) => {
        if (editName.trim()) {
            if (item.type === 'report') {
                updateReport(projectId, item.id, { name: editName.trim() });
            } else {
                updateFolder(projectId, item.id, { name: editName.trim() });
            }
            onProjectsChange();
        }
        setEditingItemId(null);
    };

    const saveProjectName = () => {
        if (editingProjectId && editName.trim()) {
            updateProject(editingProjectId, { name: editName.trim() });
            onProjectsChange();
        }
        setEditingProjectId(null);
    };

    // Context menu handlers
    const handleProjectContextMenu = (e: React.MouseEvent, project: Project) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: [
                {
                    label: 'Rename',
                    onClick: () => startEditItem(project.id, project.name, true),
                },
                {
                    label: 'New File',
                    onClick: () => {
                        setAddingTo({ projectId: project.id, parentId: null, type: 'report' });
                        setNewItemName('');
                        setExpandedItems(prev => new Set(prev).add(project.id));
                    },
                },
                {
                    label: 'New Folder',
                    onClick: () => {
                        setAddingTo({ projectId: project.id, parentId: null, type: 'folder' });
                        setNewItemName('');
                        setExpandedItems(prev => new Set(prev).add(project.id));
                    },
                },
                {
                    label: 'Delete',
                    onClick: () => {
                        setConfirmDialog({
                            title: 'Delete Project',
                            message: 'Delete this project and all its contents?',
                            onConfirm: () => {
                                deleteProject(project.id);
                                onProjectsChange();
                                setConfirmDialog(null);
                            },
                        });
                    },
                    dangerous: true,
                },
            ],
        });
    };

    const handleFolderContextMenu = (e: React.MouseEvent, projectId: string, folder: Folder) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: [
                {
                    label: 'Rename',
                    onClick: () => startEditItem(folder.id, folder.name),
                },
                {
                    label: 'New File',
                    onClick: () => {
                        setAddingTo({ projectId, parentId: folder.id, type: 'report' });
                        setNewItemName('');
                        setExpandedItems(prev => new Set(prev).add(folder.id));
                    },
                },
                {
                    label: 'New Folder',
                    onClick: () => {
                        setAddingTo({ projectId, parentId: folder.id, type: 'folder' });
                        setNewItemName('');
                        setExpandedItems(prev => new Set(prev).add(folder.id));
                    },
                },
                {
                    label: 'Delete',
                    onClick: () => {
                        setConfirmDialog({
                            title: 'Delete Folder',
                            message: 'Delete this folder and all its contents?',
                            onConfirm: () => {
                                deleteItem(projectId, folder.id);
                                onProjectsChange();
                                setConfirmDialog(null);
                            },
                        });
                    },
                    dangerous: true,
                },
            ],
        });
    };

    const handleReportContextMenu = (e: React.MouseEvent, projectId: string, report: Report) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: [
                {
                    label: 'Rename',
                    onClick: () => startEditItem(report.id, report.name),
                },
                {
                    label: 'Delete',
                    onClick: () => {
                        setConfirmDialog({
                            title: 'Delete Report',
                            message: 'Delete this report?',
                            onConfirm: () => {
                                deleteItem(projectId, report.id);
                                onProjectsChange();
                                setConfirmDialog(null);
                            },
                        });
                    },
                    dangerous: true,
                },
            ],
        });
    };

    // Recursive item renderer
    const renderItem = (item: FileSystemItem, projectId: string, depth: number = 0, isParentClosing: boolean = false) => {
        const isExpanded = expandedItems.has(item.id);
        const isClosing = closingItems.has(item.id);
        const isEditing = editingItemId === item.id;
        const isAddingHere = addingTo?.parentId === item.id;

        if (item.type === 'folder') {
            return (
                <div key={item.id}>
                    <div
                        onClick={() => toggleExpand(item.id)}
                        onContextMenu={(e) => handleFolderContextMenu(e, projectId, item)}
                        className={`
                            flex items-center gap-2 px-2 py-1 rounded cursor-pointer group
                            text-white/60 hover:bg-white/5 hover:text-white
                        `}
                    >
                        <span className="text-[10px]">{isExpanded && !isClosing ? '📂' : '📁'}</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={() => saveItemName(projectId, item)}
                                onKeyDown={(e) => e.key === 'Enter' && saveItemName(projectId, item)}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 bg-white/10 text-xs text-white px-1 rounded focus:outline-none"
                                autoFocus
                            />
                        ) : (
                            <span className="flex-1 text-xs truncate">{item.name}</span>
                        )}
                        <span className="text-[10px] text-white/30">{item.children.length}</span>
                    </div>

                    {/* Grid wrapper for smooth height animation */}
                    <div className={`folder-content-wrapper ${isExpanded && !isClosing ? 'expanded' : ''} ${isClosing ? 'closing' : ''}`}>
                        <div className="folder-content-inner ml-3 pl-2 border-l border-white/10">
                            {/* New item input */}
                            {isAddingHere && (
                                <div className="mb-1 p-1.5 bg-white/5 rounded border border-white/10">
                                    <input
                                        type="text"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        placeholder={addingTo.type === 'folder' ? 'Folder name...' : 'File name...'}
                                        className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none mb-1.5"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateItem(projectId)}
                                    />
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleCreateItem(projectId)}
                                            className="flex-1 text-[10px] bg-white text-black py-0.5 rounded hover:bg-gray-200 transition-colors"
                                        >
                                            Add
                                        </button>
                                        <button
                                            onClick={() => { setAddingTo(null); setNewItemName(''); }}
                                            className="flex-1 text-[10px] bg-white/10 text-white py-0.5 rounded hover:bg-white/20 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                            {item.children.map(child => renderItem(child, projectId, depth + 1, isClosing))}
                        </div>
                    </div>
                </div>
            );
        }

        // Report item
        return (
            <div
                key={item.id}
                onClick={() => onSelectReport(projectId, item.id)}
                onContextMenu={(e) => handleReportContextMenu(e, projectId, item)}
                className={`
                    ${isParentClosing ? 'report-item-closing' : 'report-item'} flex items-center gap-2 px-2 py-1 rounded cursor-pointer group
                    ${selectedReportId === item.id ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white'}
                `}
            >
                <span className="text-[10px]">📄</span>
                {isEditing ? (
                    <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => saveItemName(projectId, item)}
                        onKeyDown={(e) => e.key === 'Enter' && saveItemName(projectId, item)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-white/10 text-xs text-white px-1 rounded focus:outline-none"
                        autoFocus
                    />
                ) : (
                    <span className="flex-1 text-xs truncate">{item.name}</span>
                )}
            </div>
        );
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
                                onClick={() => toggleExpand(project.id)}
                                onContextMenu={(e) => handleProjectContextMenu(e, project)}
                                className={`
                                    flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group
                                    text-white/70 hover:bg-white/5 hover:text-white
                                `}
                            >
                                <span className="text-xs">{expandedItems.has(project.id) && !closingItems.has(project.id) ? '📂' : '📁'}</span>
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
                                    <span className="flex-1 text-sm truncate">{project.name}</span>
                                )}
                                <span className="text-[10px] text-white/30">{project.items.length}</span>
                            </div>

                            {/* Project Contents - Grid wrapper for smooth height animation */}
                            <div className={`folder-content-wrapper ${expandedItems.has(project.id) && !closingItems.has(project.id) ? 'expanded' : ''} ${closingItems.has(project.id) ? 'closing' : ''}`}>
                                <div className="folder-content-inner ml-3 pl-2 border-l border-white/10 mt-1 space-y-0.5">
                                    {/* New item input at project root */}
                                    {addingTo?.projectId === project.id && addingTo?.parentId === null && (
                                        <div className="mb-1 p-1.5 bg-white/5 rounded border border-white/10">
                                            <input
                                                type="text"
                                                value={newItemName}
                                                onChange={(e) => setNewItemName(e.target.value)}
                                                placeholder={addingTo.type === 'folder' ? 'Folder name...' : 'File name...'}
                                                className="w-full bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none mb-1.5"
                                                autoFocus
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreateItem(project.id)}
                                            />
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleCreateItem(project.id)}
                                                    className="flex-1 text-[10px] bg-white text-black py-0.5 rounded hover:bg-gray-200 transition-colors"
                                                >
                                                    Add
                                                </button>
                                                <button
                                                    onClick={() => { setAddingTo(null); setNewItemName(''); }}
                                                    className="flex-1 text-[10px] bg-white/10 text-white py-0.5 rounded hover:bg-white/20 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {project.items.map(item => renderItem(item, project.id, 0, closingItems.has(project.id)))}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenu.items}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={!!confirmDialog}
                title={confirmDialog?.title || ''}
                message={confirmDialog?.message || ''}
                onConfirm={confirmDialog?.onConfirm || (() => { })}
                onCancel={() => setConfirmDialog(null)}
            />
        </div>
    );
}
