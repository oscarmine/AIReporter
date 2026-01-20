import { useState, useCallback, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { SettingsView } from './components/SettingsView';
import { MarkdownEditor } from './components/MarkdownEditor';
import { ImageGallery } from './components/ImageGallery';
import { InputModal } from './components/InputModal';
import { ImageEditor } from './components/ImageEditor';
import { HackerOneReportView } from './components/HackerOneReportView';
import { Dropdown } from './components/Dropdown';
import { ToastContainer, useToast } from './components/Toast';
import { ExportPDFModal } from './components/ExportPDFModal';
import { Project, getProjects, updateReport, getSettings, findReport } from './lib/storage';
import { storeImage, getImagesForReport, replaceImageReferences, replaceImageReferencesWithBase64, updateImageDescription, StoredImage } from './lib/images';
import { parseHackerOneReport } from './lib/h1Parser';

type View = 'home' | 'report' | 'settings';
type ReportTab = 'findings' | 'report';

// Supported languages for report generation
const REPORT_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese (Simplified)',
  'Japanese', 'Korean', 'Arabic', 'Hindi', 'Turkish', 'Dutch', 'Polish', 'Indonesian', 'Vietnamese',
  'Thai', 'Ukrainian', 'Swedish', 'Uzbek', 'Persian (Farsi)', 'Kazakh', 'Kyrgyz', 'Tajik', 'Turkmen',
  'Pashto', 'Dari', 'Azerbaijani', 'Georgian', 'Armenian'
];

import { APP_NAME } from './lib/constants';

function App() {
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  const [activeView, setActiveView] = useState<View>('home');
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('findings');
  const [reportLanguage, setReportLanguage] = useState('English');
  const [reportMode, setReportMode] = useState('standard'); // Current report's display mode
  const [pendingMode, setPendingMode] = useState('standard'); // Mode selected for next generation
  const [redactionLevel, setRedactionLevel] = useState('none'); // Redaction level for generation
  const [findings, setFindings] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [reportImages, setReportImages] = useState<StoredImage[]>([]);
  const [pendingUpload, setPendingUpload] = useState<File | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState('');
  const [editorImage, setEditorImage] = useState<{ src: string; file?: File; imageId?: string; description?: string } | null>(null);
  const [editorDirty, setEditorDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toasts, addToast, removeToast } = useToast();


  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Ref to track current report ID for stale closures
  const selectedReportIdRef = useRef<string | null>(null);

  // Sync ref with state
  useEffect(() => {
    selectedReportIdRef.current = selectedReportId;
  }, [selectedReportId]);

  // Load projects on mount
  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const refreshProjects = useCallback(() => {
    setProjects(getProjects());
  }, []);

  // Refresh images for current report
  const refreshImages = useCallback(() => {
    if (selectedReportId) {
      setReportImages(getImagesForReport(selectedReportId));
    }
  }, [selectedReportId]);

  // Get current report
  const currentReport = selectedProjectId && selectedReportId ? findReport(selectedProjectId, selectedReportId) : null;

  // Load report content when selected
  useEffect(() => {
    if (currentReport) {
      setFindings(currentReport.findings);
      setMarkdown(currentReport.markdown);
      setReportMode(currentReport.mode || 'standard'); // Load saved mode or default
      setPendingMode(currentReport.mode || 'standard'); // Sync pending mode too
      setActiveView('report');
      // Only reset tab if we're not waiting on a generation for this report
      if (!generatingReports.has(currentReport.id)) {
        // We stay on the current tab (findings vs report) or default to findings?
        // User didn't specify behavior here, but keeping previous logic of resetting to findings on new select seems safe 
        // UNLESS preventing tab switch was globally desired. But usually finding tab is where you start.
        // Let's stick to existing behavior for fresh selects, but we won't switch tabs on completion.
        setActiveReportTab('findings');
      }
    }
  }, [selectedReportId]);

  // Prevent Ctrl+A from selecting everything when not focused on an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const activeElement = document.activeElement;
        const isInputFocused = activeElement instanceof HTMLTextAreaElement ||
          activeElement instanceof HTMLInputElement ||
          activeElement?.getAttribute('contenteditable') === 'true';

        if (!isInputFocused) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load images when report changes
  useEffect(() => {
    if (selectedReportId) {
      setReportImages(getImagesForReport(selectedReportId));
    } else {
      setReportImages([]);
    }
  }, [selectedReportId]);

  // Helper to check if we can navigate away from editor
  const canLeaveEditor = useCallback(() => {
    if (!editorImage) return true;
    if (!editorDirty) {
      setEditorImage(null);
      return true;
    }
    if (confirm('You have unsaved paint edits. Discard changes?')) {
      setEditorImage(null);
      setEditorDirty(false);
      return true;
    }
    return false;
  }, [editorImage, editorDirty]);

  const handleSelectProject = useCallback((projectId: string) => {
    if (!canLeaveEditor()) return;
    setSelectedProjectId(projectId);
    setSelectedReportId(null);
    setActiveView('home');
  }, [canLeaveEditor]);

  const handleSelectReport = useCallback((projectId: string, reportId: string) => {
    if (!canLeaveEditor()) return;
    setSelectedProjectId(projectId);
    setSelectedReportId(reportId);
    setActiveView('report');
  }, [canLeaveEditor]);


  // Auto-save report when content changes
  useEffect(() => {
    if (selectedProjectId && selectedReportId) {
      const timer = setTimeout(() => {
        updateReport(selectedProjectId, selectedReportId, { findings, markdown, mode: reportMode });
        refreshProjects();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [findings, markdown, reportMode, selectedProjectId, selectedReportId, refreshProjects]);

  const handleGenerate = useCallback(async () => {
    if (!findings.trim()) {
      addToast('Please enter some findings first', 'error');
      return;
    }

    const settings = getSettings();
    if (!settings.apiKey) {
      addToast('Please configure your API key in Settings first', 'error');
      setActiveView('settings');
      return;
    }

    // Capture current report context at start to prevent race condition
    const capturedProjectId = selectedProjectId;
    const capturedReportId = selectedReportId;
    const capturedFindings = findings;
    const capturedImages = [...reportImages];
    const capturedMode = pendingMode; // Capture mode at generation start
    const capturedRedaction = redactionLevel; // Capture redaction level

    if (!capturedReportId || !capturedProjectId) return;

    setGeneratingReports(prev => new Set(prev).add(capturedReportId));

    try {
      // Filter out invalid @img-xxx references from findings (only keep valid uploaded image IDs)
      const validImageIds = new Set(capturedImages.map(img => img.id));
      const cleanedFindings = capturedFindings.replace(/@(img-[a-z0-9]+)/g, (match, id) => {
        return validImageIds.has(id) ? match : ''; // Remove fake image references
      });

      // Include available image IDs in prompt context (wrapped in {} to separate from findings)
      const imageContext = capturedImages.length > 0
        ? `\n\n[ATTACHED SCREENSHOTS]\n${capturedImages.map(img => `{${img.id}: "${img.description}"}`).join('\n')}`
        : '';

      const generatedReport = await window.ipcRenderer.invoke(
        'generate-report',
        cleanedFindings + imageContext,
        { ...settings, language: reportLanguage, mode: capturedMode, redaction: capturedRedaction }
      );

      // Only update local state if still on the same report
      // Use ref to check actual current report ID, preventing closure staleness
      if (selectedReportIdRef.current === capturedReportId) {
        setMarkdown(generatedReport);
        setReportMode(capturedMode);
        setActiveReportTab('report');
      }

      // Check if the report still exists before saving (user may have deleted it)
      const currentProjects = getProjects();
      const targetProject = currentProjects.find(p => p.id === capturedProjectId);
      const targetReport = capturedProjectId && capturedReportId ? findReport(capturedProjectId, capturedReportId) : null;

      if (targetProject && targetReport && capturedProjectId && capturedReportId) {
        updateReport(capturedProjectId, capturedReportId, {
          // Do NOT update findings here. User might have edited them while waiting.
          // findings: capturedFindings, 
          markdown: generatedReport,
          mode: capturedMode
        });
        refreshProjects();
        addToast(`Report "${targetReport.name}" generated successfully!`, 'success');
      } else {
        // Report was deleted during generation
        addToast('Report was deleted. Generated content discarded.', 'info');
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as Error;
      if (error.message?.includes('API_KEY_NOT_SET')) {
        addToast('Please configure your API key in Settings', 'error');
        setActiveView('settings');
      } else {
        const msg = error.message || '';
        if (msg.includes('429') || msg.includes('Quota') || msg.includes('Too Many Requests')) {
          addToast('Rate Limit Exceeded. Try another model or wait.', 'error');
        } else if (msg.includes('404') || msg.includes('Not Found')) {
          addToast('Model not available. Please switch models.', 'error');
        } else if (msg.includes('safety') || msg.includes('blocked')) {
          addToast('Blocked by safety filters. Review content.', 'error');
        } else if (msg.includes('503') || msg.includes('Overloaded')) {
          addToast('AI Service overloaded. Try again later.', 'error');
        } else {
          const cleanMsg = msg.replace('Error invoking remote method \'generate-report\': Error: ', '');
          addToast(`Error: ${cleanMsg.slice(0, 60)}${cleanMsg.length > 60 ? '...' : ''}`, 'error');
        }
      }
    } finally {
      setGeneratingReports(prev => {
        const next = new Set(prev);
        if (capturedReportId) next.delete(capturedReportId);
        return next;
      });
    }
  }, [findings, reportImages, addToast, selectedProjectId, selectedReportId, refreshProjects, reportLanguage, pendingMode]);

  const handleExportMarkdown = useCallback(async () => {
    try {
      let exportContent = markdown;

      // For HackerOne mode, build clean markdown from sections (remove delimiters)
      if (reportMode === 'hackerone') {
        const sections = parseHackerOneReport(markdown);
        exportContent = `# ${sections.title}

**Asset:** ${sections.asset}  
**Weakness:** ${sections.weakness}  
**Severity:** ${sections.severity}

---

${sections.description}

---

## Impact

${sections.impact}`;
      }

      // Replace image references with actual images for export
      // Use file:// protocol for external markdown files
      const exportMarkdown = replaceImageReferences(exportContent, reportImages, 'file');
      const success = await window.ipcRenderer.invoke('export-markdown', exportMarkdown);
      if (success) {
        addToast('Markdown exported successfully!', 'success');
      }
    } catch (error) {
      addToast('Failed to export markdown', 'error');
    }
  }, [markdown, reportImages, reportMode, addToast]);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [preparedExportMarkdown, setPreparedExportMarkdown] = useState('');
  const [exportTitle, setExportTitle] = useState('');

  const handleExportPDF = useCallback(() => {
    // Get current report title
    const rep = selectedProjectId && selectedReportId ? findReport(selectedProjectId, selectedReportId) : null;
    const title = rep?.name || 'Report';
    setExportTitle(title);

    let exportContent = markdown;

    // For HackerOne mode, build clean markdown from sections (remove delimiters)
    if (reportMode === 'hackerone') {
      const sections = parseHackerOneReport(markdown);
      exportContent = `# ${sections.title}

**Asset:** ${sections.asset}  
**Weakness:** ${sections.weakness}  
**Severity:** ${sections.severity}

---

${sections.description}

---

## Impact

${sections.impact}`;
    }

    // Replace image references with actual images for PDF
    // Use Base64 to likely avoid "Network Service" crashes and offline issues with protocols
    replaceImageReferencesWithBase64(exportContent, reportImages).then(processedMarkdown => {
      setPreparedExportMarkdown(processedMarkdown);
      setShowExportModal(true);
    });
  }, [markdown, reportImages, reportMode, selectedProjectId, selectedReportId]);

  const handleFinalExport = async (htmlContent: string) => {
    try {
      addToast('Generating PDF...', 'info');
      const success = await window.ipcRenderer.invoke('export-pdf', htmlContent, exportTitle);
      if (success) {
        addToast('PDF exported successfully!', 'success');
      }
    } catch (error) {
      addToast('Failed to export PDF', 'error');
    }
  };

  // Handle image upload - store file and open modal for description
  const handleImageUpload = useCallback((files: FileList | null) => {
    console.log('handleImageUpload called', files);

    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    if (!selectedReportId) {
      addToast('Please select a report first', 'error');
      return;
    }

    const file = files[0];
    console.log('File:', file.name, file.type);

    if (!file.type.startsWith('image/')) {
      addToast('Please upload an image file', 'error');
      return;
    }

    // Store file and open modal for description
    setPendingUpload(file);

    // Reset file input so same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedReportId, addToast]);

  const handleRenameSubmit = useCallback((newDescription: string) => {
    if (editingImageId) {
      updateImageDescription(editingImageId, newDescription);
      refreshImages();
      setEditingImageId(null);
      addToast('Description updated', 'success');
    }
  }, [editingImageId, refreshImages, addToast]);

  // Complete the upload with description from modal - now opens editor
  const handleUploadWithDescription = useCallback(async (description: string) => {
    if (!pendingUpload || !selectedReportId) return;

    // Convert file to base64 and open editor
    const reader = new FileReader();
    reader.onload = () => {
      setEditorImage({ src: reader.result as string, file: pendingUpload, description: description || 'Screenshot' });
      setPendingUpload(null);
    };
    reader.readAsDataURL(pendingUpload);
  }, [pendingUpload, selectedReportId]);

  // Handle saving edited image (new upload)
  const handleEditorSave = useCallback(async (editedBase64: string, description: string) => {
    if (!selectedReportId || !editorImage) return;

    try {
      if (editorImage.imageId) {
        // Editing existing image - replace it and update description
        await window.ipcRenderer.invoke('replace-image', editorImage.imageId, editedBase64);
        updateImageDescription(editorImage.imageId, description);
        refreshImages();
        addToast('Screenshot updated', 'success');
      } else {
        // New upload - convert base64 to file and store
        const response = await fetch(editedBase64);
        const blob = await response.blob();
        const file = new File([blob], 'screenshot.png', { type: 'image/png' });
        const image = await storeImage(selectedReportId, file, description || 'Screenshot');
        refreshImages();
        addToast(`Screenshot added as @${image.id}`, 'success');
      }
    } catch (error) {
      console.error('Save error:', error);
      addToast('Failed to save image', 'error');
    } finally {
      setEditorImage(null);
    }
  }, [selectedReportId, editorImage, refreshImages, addToast]);

  // Handle editing existing image
  const handleEditImage = useCallback(async (imageId: string) => {
    const img = reportImages.find(i => i.id === imageId);
    if (!img) return;

    try {
      const base64 = await window.ipcRenderer.invoke('load-image', img.filePath);
      if (base64) {
        setEditorImage({ src: base64, imageId: img.id, description: img.description });
      }
    } catch (error) {
      console.error('Failed to load image for editing:', error);
      addToast('Failed to load image', 'error');
    }
  }, [reportImages, addToast]);

  // Insert @img reference at cursor
  const handleInsertRef = useCallback((imageId: string) => {
    const ref = `@${imageId}`;
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newValue = findings.slice(0, start) + ref + findings.slice(end);
      setFindings(newValue);
      // Restore cursor position
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(start + ref.length, start + ref.length);
        textareaRef.current?.focus();
      }, 0);
    } else {
      setFindings(prev => prev + ' ' + ref);
    }
    addToast(`Inserted ${ref}`, 'info');
  }, [findings, addToast]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  }, [handleImageUpload]);

  // Update preview when markdown or images change
  useEffect(() => {
    if (!markdown) {
      setPreviewMarkdown('');
      return;
    }

    // Replace @img-xxx with media:// URLs synchronously using shared logic
    const result = replaceImageReferences(markdown, reportImages);

    setPreviewMarkdown(result);
  }, [markdown, reportImages]);

  // Render content based on view
  const renderContent = () => {
    if (activeView === 'settings') {
      return <SettingsView onClose={() => setActiveView(currentReport ? 'report' : 'home')} />;
    }

    if (activeView === 'home' || !currentReport) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white/30">
            <div className="text-6xl mb-4">📁</div>
            <h2 className="text-xl font-medium text-white/50 mb-2">No Report Selected</h2>
            <p className="text-sm">Create a project and add a report to get started</p>
          </div>
        </div>
      );
    }

    const isCurrentReportGenerating = generatingReports.has(currentReport.id);

    return (
      <div className="flex flex-col h-full">
        {/* Header with tabs */}
        <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-white/5 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveReportTab('findings')}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap ${activeReportTab === 'findings'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
            >
              📝 Findings
            </button>
            <button
              onClick={() => setActiveReportTab('report')}
              className={`px-4 py-1.5 text-sm font-medium rounded transition-colors whitespace-nowrap ${activeReportTab === 'report'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
            >
              📄 Report
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeReportTab === 'findings' ? (
              <>
                <Dropdown
                  value={redactionLevel}
                  onChange={setRedactionLevel}
                  options={[
                    { value: 'none', label: 'Redact: None' },
                    { value: 'low', label: 'Redact: Low' },
                    { value: 'medium', label: 'Redact: Medium' },
                    { value: 'high', label: 'Redact: High' }
                  ]}
                  title="Redaction Level"
                />
                <Dropdown
                  value={pendingMode}
                  onChange={setPendingMode}
                  options={[
                    { value: 'standard', label: 'Standard' },
                    { value: 'hackerone', label: 'HackerOne' }
                  ]}
                  title="Report Mode (applies on next generation)"
                />
                <Dropdown
                  value={reportLanguage}
                  onChange={setReportLanguage}
                  options={REPORT_LANGUAGES.map(lang => ({ value: lang, label: lang }))}
                  title="Report Language"
                  maxHeight={300}
                />
                <button
                  onClick={handleGenerate}
                  disabled={!findings.trim() || isCurrentReportGenerating}
                  className="px-4 py-1.5 text-xs font-medium bg-white text-black hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {isCurrentReportGenerating ? (
                    <>
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>✨ Generate Report</>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleExportMarkdown}
                  disabled={!markdown}
                  className="not-prose px-3 py-1.5 text-xs font-medium bg-white text-black hover:bg-gray-200 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Export MD
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={!markdown}
                  className="not-prose px-3 py-1.5 text-xs font-medium bg-white text-black hover:bg-gray-200 rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Export PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col">
          {activeReportTab === 'findings' ? (
            <div
              className={`flex-1 flex flex-col relative ${isDragging ? 'ring-2 ring-white/30 ring-inset' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />

              {/* Image Gallery */}
              <ImageGallery
                images={reportImages}
                onRefresh={refreshImages}
                onInsertRef={handleInsertRef}
                onEdit={handleEditImage}
              />

              {/* Upload button toolbar */}
              <div className="flex items-center gap-2 px-6 pt-3 pb-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded transition-colors"
                >
                  📷 Add Screenshot
                </button>
                <span className="text-xs text-white/30">or drag & drop • use @img-xxx to reference</span>
              </div>

              <textarea
                ref={textareaRef}
                className="flex-1 w-full bg-transparent px-6 pb-6 text-base font-light leading-relaxed resize-none focus:outline-none placeholder:text-white/20 custom-scrollbar"
                placeholder={`Enter your raw findings here...

Example:
- Found SQL injection on /api/login
- Password field vulnerable to: ' OR 1=1 --
- See @img-abc123 for screenshot of the error

Tip: Add screenshots and reference them with @img-xxx`}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                spellCheck={false}
              />

              {/* Drag overlay */}
              {isDragging && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="text-white font-medium">Drop image here</div>
                  </div>
                </div>
              )}
            </div>
          ) : reportMode === 'hackerone' ? (
            <HackerOneReportView markdown={markdown} previewMarkdown={previewMarkdown} onMarkdownChange={setMarkdown} />
          ) : (
            <MarkdownEditor value={markdown} previewValue={previewMarkdown} onChange={setMarkdown} />
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Layout
        activeView={activeView}
        onViewChange={setActiveView}
        projects={projects}
        selectedProjectId={selectedProjectId}
        selectedReportId={selectedReportId}
        onSelectProject={handleSelectProject}
        onSelectReport={handleSelectReport}
        onProjectsChange={refreshProjects}
      >
        {renderContent()}
      </Layout>

      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Image Description Modal */}
      <InputModal
        isOpen={pendingUpload !== null}
        title="What does this screenshot show?"
        placeholder="e.g., XSS payload firing, Admin panel access"
        onSubmit={handleUploadWithDescription}
        onCancel={() => setPendingUpload(null)}
        submitLabel="Add Screenshot"
      />

      {/* Rename Image Modal */}
      <InputModal
        isOpen={editingImageId !== null}
        title="Rename Screenshot"
        placeholder="Enter new description"
        initialValue={reportImages.find(img => img.id === editingImageId)?.description}
        onSubmit={handleRenameSubmit}
        onCancel={() => setEditingImageId(null)}
        submitLabel="Save Changes"
      />

      {/* Image Editor */}
      {editorImage && (
        <ImageEditor
          imageSrc={editorImage.src}
          initialDescription={editorImage.description}
          onSave={handleEditorSave}
          onCancel={() => { setEditorImage(null); setEditorDirty(false); }}
          onDirtyChange={setEditorDirty}
        />
      )}

      {/* Export PDF Modal */}
      <ExportPDFModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleFinalExport}
        markdown={preparedExportMarkdown}
        title={exportTitle}
      />
    </>
  );
}

export default App;
