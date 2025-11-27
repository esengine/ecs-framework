import { IValidator, ValidationResult } from '../../domain/interfaces/IValidator';
import { ITreeState } from '../commands/ITreeState';

/**
 * 验证行为树用例
 */
export class ValidateTreeUseCase {
    constructor(
        private readonly validator: IValidator,
        private readonly treeState: ITreeState
    ) {}

    /**
     * 验证当前行为树
     */
    execute(): ValidationResult {
        const tree = this.treeState.getTree();
        return this.validator.validateTree(tree);
    }

    /**
     * 验证并抛出错误（如果验证失败）
     */
    executeAndThrow(): void {
        const result = this.execute();

        if (!result.isValid) {
            const errorMessages = result.errors.map((e) => e.message).join('\n');
            throw new Error(`行为树验证失败:\n${errorMessages}`);
        }
    }
}
