import { ViewModel, observable, computed, command } from '@esengine/mvvm-ui-framework';

/**
 * 游戏状态视图模型
 */
export class GameStateViewModel extends ViewModel {
    
    public get name(): string {
        return 'GameStateViewModel';
    }

    @observable
    currentLevel: number = 1;

    @observable
    health: number = 100;

    @observable
    mana: number = 50;

    @observable
    experience: number = 0;

    @computed(['health'])
    get healthPercent(): number {
        return (this.health / 100) * 100;
    }

    @computed(['experience', 'currentLevel'])
    get experienceToNextLevel(): number {
        return (this.currentLevel * 100) - this.experience;
    }

    @command()
    public levelUp(): void {
        this.currentLevel += 1;
        this.health = 100;
        this.mana += 10;
    }

    @command()
    public takeDamage(damage: number): void {
        this.health = Math.max(0, this.health - damage);
    }
} 