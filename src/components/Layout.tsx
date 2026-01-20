import { ProjectsSidebar } from './ProjectsSidebar';
import { Project } from '../lib/storage';

import { APP_NAME } from '../lib/constants';

type View = 'home' | 'report' | 'settings';

interface LayoutProps {
    children: React.ReactNode;
    activeView: View;
    onViewChange: (view: View) => void;
    projects: Project[];
    selectedProjectId: string | null;
    selectedReportId: string | null;
    onSelectProject: (projectId: string) => void;
    onSelectReport: (projectId: string, reportId: string) => void;
    onProjectsChange: () => void;
}

export function Layout({
    children,
    activeView,
    onViewChange,
    projects,
    selectedProjectId,
    selectedReportId,
    onSelectProject,
    onSelectReport,
    onProjectsChange,
}: LayoutProps) {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background text-primary selection:bg-white/20 font-sans select-none">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-surface border-r border-white/5 flex flex-col glass-panel m-2 mr-0 rounded-xl">
                <div className="p-4 border-b border-white/5 draggable flex items-center pt-6">
                    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {APP_NAME}
                    </h1>
                </div>

                {/* Projects Section */}
                <div className="flex-1 p-3 overflow-hidden">
                    <ProjectsSidebar
                        projects={projects}
                        selectedProjectId={selectedProjectId}
                        selectedReportId={selectedReportId}
                        onSelectProject={onSelectProject}
                        onSelectReport={onSelectReport}
                        onProjectsChange={onProjectsChange}
                    />
                </div>

                {/* Bottom Navigation */}
                <nav className="p-2 border-t border-white/5">
                    <NavItem
                        active={activeView === 'settings'}
                        onClick={() => onViewChange('settings')}
                        icon="⚙️"
                    >
                        Settings
                    </NavItem>
                </nav>

            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 p-4 relative">
                {/* Top drag handle for main area */}
                <div className="absolute top-0 left-0 w-full h-6 draggable z-50" />
                <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col select-text">
                    {children}
                </div>
            </main>
        </div>
    );
}

interface NavItemProps {
    children: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
    icon?: string;
}

function NavItem({ children, active, onClick, icon }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`
        w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-left
        ${active
                    ? 'bg-white/10 text-white'
                    : 'text-secondary hover:bg-white/5 hover:text-white'
                }
      `}
        >
            {icon && <span className="text-xs">{icon}</span>}
            {children}
        </button>
    );
}
