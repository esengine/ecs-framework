import { useState, ReactNode } from 'react';
import '../styles/TabPanel.css';

export interface TabItem {
  id: string;
  title: string;
  content: ReactNode;
  closable?: boolean;
}

interface TabPanelProps {
  tabs: TabItem[];
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

export function TabPanel({ tabs, activeTabId, onTabChange, onTabClose }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(activeTabId || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    onTabClose?.(tabId);
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="tab-panel">
      <div className="tab-header">
        <div className="tab-list">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span className="tab-title">{tab.title}</span>
              {tab.closable && (
                <button
                  className="tab-close"
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  title="Close"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="tab-content">
        {currentTab?.content}
      </div>
    </div>
  );
}
