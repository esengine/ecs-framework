import 'reflect-metadata';
import { ViewModel, observable } from '@esengine/mvvm-ui-framework';

/**
 * 简单的测试 ViewModel
 */
export class TestViewModel extends ViewModel {
    
    public get name(): string {
        return 'TestViewModel';
    }

    @observable
    testValue: number = 0;

    public addValue(): void {
        console.log('添加值之前:', this.testValue);
        console.log('notifyObservers 方法存在吗?', typeof this.notifyObservers);
        
        // 检查属性描述符
        const descriptor = Object.getOwnPropertyDescriptor(this, 'testValue') || 
                          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(this), 'testValue');
        console.log('testValue 属性描述符:', descriptor);
        
        // 检查私有属性
        console.log('_testValue 私有属性:', (this as any)._testValue);
        
        this.testValue += 1;
        console.log('添加值之后:', this.testValue);
        console.log('_testValue 私有属性 (之后):', (this as any)._testValue);
        
        // 手动触发通知测试
        if (this.notifyObservers) {
            console.log('手动触发通知');
            this.notifyObservers('testValue', this.testValue, this.testValue - 1);
        }
    }
} 