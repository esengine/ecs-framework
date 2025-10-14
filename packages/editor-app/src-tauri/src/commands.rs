use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectInfo {
    pub name: String,
    pub path: String,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EditorConfig {
    pub theme: String,
    pub auto_save: bool,
    pub recent_projects: Vec<String>,
}

impl Default for EditorConfig {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            auto_save: true,
            recent_projects: Vec::new(),
        }
    }
}
