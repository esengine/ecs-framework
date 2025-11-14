import { singleton } from 'tsyringe';
import type { ICommand, ICommandRegistry, KeyBinding } from '../interfaces/ICommandRegistry';

@singleton()
export class CommandRegistry implements ICommandRegistry {
    private commands = new Map<string, ICommand>();

    register(command: ICommand): void {
        if (this.commands.has(command.id)) {
            console.warn(`Command ${command.id} is already registered. Overwriting.`);
        }
        this.commands.set(command.id, command);
    }

    unregister(commandId: string): void {
        this.commands.delete(commandId);
    }

    async execute(commandId: string, context?: unknown): Promise<void> {
        const command = this.commands.get(commandId);
        if (!command) {
            throw new Error(`Command ${commandId} not found`);
        }

        if (command.when && !command.when()) {
            console.warn(`Command ${commandId} cannot be executed (when clause failed)`);
            return;
        }

        try {
            await command.execute(context);
        } catch (error) {
            console.error(`Error executing command ${commandId}:`, error);
            throw error;
        }
    }

    getCommand(commandId: string): ICommand | undefined {
        return this.commands.get(commandId);
    }

    getCommands(): ICommand[] {
        return Array.from(this.commands.values());
    }

    getKeybindings(): Array<{ command: ICommand; keybinding: KeyBinding }> {
        const bindings: Array<{ command: ICommand; keybinding: KeyBinding }> = [];

        for (const command of this.commands.values()) {
            if (command.keybinding) {
                bindings.push({ command, keybinding: command.keybinding });
            }
        }

        return bindings;
    }
}
