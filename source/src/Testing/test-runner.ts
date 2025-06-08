import { runBitMaskOptimizerTests } from './Unit/bitmask-optimizer.test';
import { runComponentPoolTests } from './Unit/component-pool.test';

/**
 * 测试运行器 - 统一运行所有测试
 */
export class TestRunner {
    private results: Map<string, { passed: number; failed: number; duration: number }> = new Map();

    /**
     * 运行所有单元测试
     */
    async runUnitTests(): Promise<void> {
        console.log('🧪 运行单元测试');
        console.log('='.repeat(50));

        await this.runTest('组件对象池', runComponentPoolTests);
        await this.runTest('位掩码优化器', runBitMaskOptimizerTests);
        
        console.log('\n📊 单元测试总结:');
        this.printSummary();
    }

    /**
     * 运行性能测试
     */
    async runPerformanceTests(): Promise<void> {
        console.log('\n🚀 运行性能测试');
        console.log('='.repeat(50));

        // 性能测试需要从benchmark.ts文件中导入
        console.log('⚠️ 性能测试需要单独运行 - 请使用: node benchmark.ts');

        console.log('\n📊 性能测试总结:');
        this.printSummary();
    }

    /**
     * 运行集成测试
     */
    async runIntegrationTests(): Promise<void> {
        console.log('\n🔗 运行集成测试');
        console.log('='.repeat(50));

        // 集成测试待实现
        console.log('⚠️ 集成测试尚未实现');
    }

    /**
     * 运行所有测试
     */
    async runAllTests(): Promise<void> {
        console.log('🎯 ECS框架完整测试套件');
        console.log('='.repeat(60));

        const startTime = performance.now();

        await this.runUnitTests();
        await this.runPerformanceTests();
        await this.runIntegrationTests();

        const endTime = performance.now();
        const totalDuration = endTime - startTime;

        console.log('\n✅ 所有测试完成');
        console.log(`🕐 总测试时间: ${(totalDuration / 1000).toFixed(2)}秒`);
        
        this.printFinalSummary();
    }

    /**
     * 运行单个测试
     */
    private async runTest(testName: string, testFunction: () => void | Promise<void>): Promise<void> {
        console.log(`\n▶️ 开始测试: ${testName}`);
        
        const startTime = performance.now();
        let passed = 0;
        let failed = 0;

        try {
            await testFunction();
            passed = 1;
            console.log(`✅ ${testName} 测试通过`);
        } catch (error) {
            failed = 1;
            console.error(`❌ ${testName} 测试失败:`, error);
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        this.results.set(testName, { passed, failed, duration });
        
        console.log(`⏱️ 耗时: ${duration.toFixed(2)}ms`);
    }

    /**
     * 打印测试摘要
     */
    private printSummary(): void {
        let totalPassed = 0;
        let totalFailed = 0;
        let totalDuration = 0;

        for (const [name, result] of this.results) {
            totalPassed += result.passed;
            totalFailed += result.failed;
            totalDuration += result.duration;
            
            const status = result.failed > 0 ? '❌' : '✅';
            console.log(`  ${status} ${name}: ${result.duration.toFixed(2)}ms`);
        }

        console.log(`\n📈 测试统计:`);
        console.log(`  通过: ${totalPassed}`);
        console.log(`  失败: ${totalFailed}`);
        console.log(`  总时间: ${totalDuration.toFixed(2)}ms`);
        console.log(`  成功率: ${totalPassed + totalFailed > 0 ? (totalPassed / (totalPassed + totalFailed) * 100).toFixed(1) : 0}%`);
    }

    /**
     * 打印最终测试摘要
     */
    private printFinalSummary(): void {
        console.log('\n📋 最终测试报告');
        console.log('='.repeat(60));

        let totalPassed = 0;
        let totalFailed = 0;

        for (const [, result] of this.results) {
            totalPassed += result.passed;
            totalFailed += result.failed;
        }

        if (totalFailed === 0) {
            console.log('🎉 所有测试都通过了！');
        } else {
            console.log(`⚠️ 有 ${totalFailed} 个测试失败`);
        }

        console.log(`📊 测试覆盖率: ${this.results.size} 个测试模块`);
        console.log(`✅ 通过率: ${totalPassed + totalFailed > 0 ? (totalPassed / (totalPassed + totalFailed) * 100).toFixed(1) : 0}%`);
    }

    /**
     * 清除测试结果
     */
    clearResults(): void {
        this.results.clear();
    }
}

/**
 * 便捷函数：运行所有测试
 */
export async function runAllTests(): Promise<void> {
    const runner = new TestRunner();
    await runner.runAllTests();
}

/**
 * 便捷函数：仅运行单元测试
 */
export async function runUnitTests(): Promise<void> {
    const runner = new TestRunner();
    await runner.runUnitTests();
}

/**
 * 便捷函数：仅运行性能测试
 */
export async function runPerformanceTests(): Promise<void> {
    const runner = new TestRunner();
    await runner.runPerformanceTests();
}

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
    runAllTests().catch(console.error);
} 