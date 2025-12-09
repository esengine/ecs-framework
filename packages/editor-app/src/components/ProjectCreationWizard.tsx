import { useState } from 'react';
import { Folder, Sparkles, X } from 'lucide-react';
import { useLocale } from '../hooks/useLocale';
import '../styles/ProjectCreationWizard.css';

// 项目模板类型（使用翻译键）
// Project template type (using translation keys)
interface ProjectTemplate {
    id: string;
    nameKey: string;      // 翻译键 | Translation key
    descriptionKey: string;
}

const templates: ProjectTemplate[] = [
    {
        id: 'blank',
        nameKey: 'project.wizard.templates.blank',
        descriptionKey: 'project.wizard.templates.blankDesc'
    }
];

interface ProjectCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateProject: (projectName: string, projectPath: string, templateId: string) => void;
    onBrowsePath: () => Promise<string | null>;
    locale: string;
}

export function ProjectCreationWizard({
    isOpen,
    onClose,
    onCreateProject,
    onBrowsePath,
    locale: _locale
}: ProjectCreationWizardProps) {
    const { t } = useLocale();
    const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
    const [projectName, setProjectName] = useState('MyProject');
    const [projectPath, setProjectPath] = useState('');

    if (!isOpen) return null;

    const currentTemplate = templates.find(tmpl => tmpl.id === selectedTemplate);

    const handleBrowse = async () => {
        const path = await onBrowsePath();
        if (path) {
            setProjectPath(path);
        }
    };

    const handleCreate = () => {
        if (projectName && projectPath) {
            onCreateProject(projectName, projectPath, selectedTemplate);
            onClose();
        }
    };

    return (
        <div className="project-wizard-overlay">
            <div className="project-wizard">
                <div className="wizard-header">
                    <h1>{t('project.wizard.title')}</h1>
                    <button className="wizard-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="wizard-body">
                    {/* Templates grid */}
                    <div className="wizard-templates">
                        <div className="templates-header">
                            <h3>{t('project.wizard.selectTemplate')}</h3>
                        </div>
                        <div className="templates-grid">
                            {templates.map(template => (
                                <button
                                    key={template.id}
                                    className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedTemplate(template.id)}
                                >
                                    <div className="template-preview">
                                        <Sparkles size={32} />
                                    </div>
                                    <div className="template-name">
                                        {t(template.nameKey)}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right - Preview and settings */}
                    <div className="wizard-details">
                        <div className="details-preview">
                            <div className="preview-placeholder">
                                <Sparkles size={48} />
                            </div>
                        </div>

                        <div className="details-info">
                            <h2>{currentTemplate ? t(currentTemplate.nameKey) : ''}</h2>
                            <p>{currentTemplate ? t(currentTemplate.descriptionKey) : ''}</p>
                        </div>

                        <div className="details-settings">
                            <h3>{t('project.wizard.projectSettings')}</h3>

                            <div className="setting-field">
                                <label>{t('project.wizard.projectName')}</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="MyProject"
                                />
                            </div>

                            <div className="setting-field">
                                <label>{t('project.wizard.projectLocation')}</label>
                                <div className="path-input-group">
                                    <input
                                        type="text"
                                        value={projectPath}
                                        onChange={(e) => setProjectPath(e.target.value)}
                                        placeholder="D:\Projects"
                                    />
                                    <button className="browse-btn" onClick={handleBrowse}>
                                        <Folder size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="wizard-footer">
                    <button className="wizard-btn secondary" onClick={onClose}>
                        {t('project.wizard.cancel')}
                    </button>
                    <button
                        className="wizard-btn primary"
                        onClick={handleCreate}
                        disabled={!projectName || !projectPath}
                    >
                        {t('project.wizard.create')}
                    </button>
                </div>
            </div>
        </div>
    );
}
