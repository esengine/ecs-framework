import { BlackboardValue } from '../../domain/models/Blackboard';

type BlackboardVariables = Record<string, BlackboardValue>;

export class BlackboardManager {
    private initialVariables: BlackboardVariables = {};
    private currentVariables: BlackboardVariables = {};

    setInitialVariables(variables: BlackboardVariables): void {
        this.initialVariables = JSON.parse(JSON.stringify(variables)) as BlackboardVariables;
    }

    getInitialVariables(): BlackboardVariables {
        return { ...this.initialVariables };
    }

    setCurrentVariables(variables: BlackboardVariables): void {
        this.currentVariables = { ...variables };
    }

    getCurrentVariables(): BlackboardVariables {
        return { ...this.currentVariables };
    }

    updateVariable(key: string, value: BlackboardValue): void {
        this.currentVariables[key] = value;
    }

    restoreInitialVariables(): BlackboardVariables {
        this.currentVariables = { ...this.initialVariables };
        return this.getInitialVariables();
    }

    hasChanges(): boolean {
        return JSON.stringify(this.currentVariables) !== JSON.stringify(this.initialVariables);
    }

    clear(): void {
        this.initialVariables = {};
        this.currentVariables = {};
    }
}
