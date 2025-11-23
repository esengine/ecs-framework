import { useState } from 'react';
import { Folder, Sparkles, X } from 'lucide-react';
import '../styles/ProjectCreationWizard.css';

// 项目模板类型
interface ProjectTemplate {
    id: string;
    name: string;
    nameZh: string;
    description: string;
    descriptionZh: string;
}

const templates: ProjectTemplate[] = [
    {
        id: 'blank',
        name: 'Blank',
        nameZh: '空白',
        description: 'A blank project with no starter content. Perfect for starting from scratch.',
        descriptionZh: '不包含任何启动内容的空白项目，适合从零开始创建。'
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
    locale
}: ProjectCreationWizardProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('blank');
    const [projectName, setProjectName] = useState('MyProject');
    const [projectPath, setProjectPath] = useState('');

    const t = {
        title: locale === 'zh' ? '项目浏览器' : 'Project Browser',
        recentProjects: locale === 'zh' ? '最近打开的项目' : 'Recent Projects',
        newProject: locale === 'zh' ? '新建项目' : 'New Project',
        projectName: locale === 'zh' ? '项目名称' : 'Project Name',
        projectLocation: locale === 'zh' ? '项目位置' : 'Project Location',
        browse: locale === 'zh' ? '浏览...' : 'Browse...',
        create: locale === 'zh' ? '创建' : 'Create',
        cancel: locale === 'zh' ? '取消' : 'Cancel',
        selectTemplate: locale === 'zh' ? '选择模板' : 'Select a Template',
        projectSettings: locale === 'zh' ? '项目设置' : 'Project Settings',
        blank: locale === 'zh' ? '空白' : 'Blank',
        blankDesc: locale === 'zh' ? '不含任何代码的空白项目。' : 'A blank project with no code.'
    };

    if (!isOpen) return null;

    const currentTemplate = templates.find(t => t.id === selectedTemplate);

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
                    <h1>{t.title}</h1>
                    <button className="wizard-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className="wizard-body">
                    {/* Templates grid */}
                    <div className="wizard-templates">
                        <div className="templates-header">
                            <h3>{t.selectTemplate}</h3>
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
                                        {locale === 'zh' ? template.nameZh : template.name}
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
                            <h2>{locale === 'zh' ? currentTemplate?.nameZh : currentTemplate?.name}</h2>
                            <p>{locale === 'zh' ? currentTemplate?.descriptionZh : currentTemplate?.description}</p>
                        </div>

                        <div className="details-settings">
                            <h3>{t.projectSettings}</h3>

                            <div className="setting-field">
                                <label>{t.projectName}</label>
                                <input
                                    type="text"
                                    value={projectName}
                                    onChange={(e) => setProjectName(e.target.value)}
                                    placeholder="MyProject"
                                />
                            </div>

                            <div className="setting-field">
                                <label>{t.projectLocation}</label>
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
                        {t.cancel}
                    </button>
                    <button
                        className="wizard-btn primary"
                        onClick={handleCreate}
                        disabled={!projectName || !projectPath}
                    >
                        {t.create}
                    </button>
                </div>
            </div>
        </div>
    );
}
