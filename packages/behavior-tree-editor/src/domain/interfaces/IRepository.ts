import { BehaviorTree } from '../models/BehaviorTree';

/**
 * 仓储接口
 * 负责行为树的持久化
 */
export interface IBehaviorTreeRepository {
    /**
     * 保存行为树
     */
    save(tree: BehaviorTree, path: string): Promise<void>;

    /**
     * 加载行为树
     */
    load(path: string): Promise<BehaviorTree>;

    /**
     * 检查文件是否存在
     */
    exists(path: string): Promise<boolean>;

    /**
     * 删除行为树文件
     */
    delete(path: string): Promise<void>;
}
