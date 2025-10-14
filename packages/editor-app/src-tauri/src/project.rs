use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub name: String,
    pub path: PathBuf,
    pub scenes: Vec<String>,
    pub assets: Vec<String>,
}

impl Project {
    pub fn new(name: String, path: PathBuf) -> Self {
        Self {
            name,
            path,
            scenes: Vec::new(),
            assets: Vec::new(),
        }
    }

    pub fn load(path: &PathBuf) -> Result<Self, String> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| format!("Failed to read project file: {}", e))?;

        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse project file: {}", e))
    }

    pub fn save(&self) -> Result<(), String> {
        let mut project_file = self.path.clone();
        project_file.push("project.json");

        let content = serde_json::to_string_pretty(self)
            .map_err(|e| format!("Failed to serialize project: {}", e))?;

        std::fs::write(&project_file, content)
            .map_err(|e| format!("Failed to write project file: {}", e))?;

        Ok(())
    }
}
