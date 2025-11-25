interface ImportMap {
    imports: Record<string, string>;
    scopes?: Record<string, Record<string, string>>;
}

const SDK_MODULES: Record<string, string> = {
    '@esengine/editor-runtime': 'editor-runtime.js',
    '@esengine/behavior-tree': 'behavior-tree.js',
};

class ImportMapManager {
    private initialized = false;
    private importMap: ImportMap = { imports: {} };

    async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        await this.buildImportMap();
        this.injectImportMap();

        this.initialized = true;
        console.log('[ImportMapManager] Import Map initialized:', this.importMap);
    }

    private async buildImportMap(): Promise<void> {
        const baseUrl = this.getBaseUrl();

        for (const [moduleName, fileName] of Object.entries(SDK_MODULES)) {
            this.importMap.imports[moduleName] = `${baseUrl}assets/${fileName}`;
        }
    }

    private getBaseUrl(): string {
        return window.location.origin + '/';
    }

    private injectImportMap(): void {
        const existingMap = document.querySelector('script[type="importmap"]');
        if (existingMap) {
            try {
                const existing = JSON.parse(existingMap.textContent || '{}');
                this.importMap.imports = { ...existing.imports, ...this.importMap.imports };
            } catch {
                // ignore
            }
            existingMap.remove();
        }

        const script = document.createElement('script');
        script.type = 'importmap';
        script.textContent = JSON.stringify(this.importMap, null, 2);

        const head = document.head;
        const firstScript = head.querySelector('script');
        if (firstScript) {
            head.insertBefore(script, firstScript);
        } else {
            head.appendChild(script);
        }
    }

    getImportMap(): ImportMap {
        return { ...this.importMap };
    }

    isInitialized(): boolean {
        return this.initialized;
    }
}

export const importMapManager = new ImportMapManager();
