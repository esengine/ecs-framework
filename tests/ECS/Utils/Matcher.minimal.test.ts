import { Matcher } from '../../../src/ECS/Utils/Matcher';

describe('Matcher最小测试', () => {
    test('创建空匹配器', () => {
        const matcher = Matcher.empty();
        expect(matcher).toBeDefined();
        expect(matcher.toString()).toBe('Matcher()');
    });
    
    test('匹配器配置方法', () => {
        const matcher = Matcher.empty();
        
        // 这些方法应该返回匹配器本身
        expect(matcher.all()).toBe(matcher);
        expect(matcher.exclude()).toBe(matcher);
        expect(matcher.one()).toBe(matcher);
    });
    
    test('获取匹配器配置', () => {
        const matcher = Matcher.empty();
        
        expect(matcher.getAllSet()).toEqual([]);
        expect(matcher.getExclusionSet()).toEqual([]);
        expect(matcher.getOneSet()).toEqual([]);
    });
});