import { NumberExtension } from '../../../src/Utils/Extensions/NumberExtension';

describe('NumberExtension - 数字扩展工具类测试', () => {
    describe('toNumber 方法测试', () => {
        it('应该能够转换数字类型', () => {
            expect(NumberExtension.toNumber(42)).toBe(42);
            expect(NumberExtension.toNumber(0)).toBe(0);
            expect(NumberExtension.toNumber(-42)).toBe(-42);
            expect(NumberExtension.toNumber(3.14)).toBe(3.14);
            expect(NumberExtension.toNumber(-3.14)).toBe(-3.14);
        });

        it('应该能够转换字符串数字', () => {
            expect(NumberExtension.toNumber('42')).toBe(42);
            expect(NumberExtension.toNumber('0')).toBe(0);
            expect(NumberExtension.toNumber('-42')).toBe(-42);
            expect(NumberExtension.toNumber('3.14')).toBe(3.14);
            expect(NumberExtension.toNumber('-3.14')).toBe(-3.14);
        });

        it('应该能够转换科学计数法字符串', () => {
            expect(NumberExtension.toNumber('1e5')).toBe(100000);
            expect(NumberExtension.toNumber('1.5e2')).toBe(150);
            expect(NumberExtension.toNumber('2e-3')).toBe(0.002);
        });

        it('应该能够转换十六进制字符串', () => {
            expect(NumberExtension.toNumber('0xFF')).toBe(255);
            expect(NumberExtension.toNumber('0x10')).toBe(16);
            expect(NumberExtension.toNumber('0x0')).toBe(0);
        });

        it('应该能够转换布尔值', () => {
            expect(NumberExtension.toNumber(true)).toBe(1);
            expect(NumberExtension.toNumber(false)).toBe(0);
        });

        it('undefined 和 null 应该返回0', () => {
            expect(NumberExtension.toNumber(undefined)).toBe(0);
            expect(NumberExtension.toNumber(null)).toBe(0);
        });

        it('应该能够处理空字符串和空白字符串', () => {
            expect(NumberExtension.toNumber('')).toBe(0);
            expect(NumberExtension.toNumber('   ')).toBe(0);
            expect(NumberExtension.toNumber('\t')).toBe(0);
            expect(NumberExtension.toNumber('\n')).toBe(0);
        });

        it('无效的字符串应该返回NaN', () => {
            expect(Number.isNaN(NumberExtension.toNumber('abc'))).toBe(true);
            expect(Number.isNaN(NumberExtension.toNumber('hello'))).toBe(true);
            expect(Number.isNaN(NumberExtension.toNumber('12abc'))).toBe(true);
        });

        it('应该能够转换数组（第一个元素）', () => {
            expect(NumberExtension.toNumber([42])).toBe(42);
            expect(NumberExtension.toNumber(['42'])).toBe(42);
            expect(NumberExtension.toNumber([])).toBe(0);
        });

        it('应该能够转换Date对象（时间戳）', () => {
            const date = new Date(2023, 0, 1);
            const timestamp = date.getTime();
            expect(NumberExtension.toNumber(date)).toBe(timestamp);
        });

        it('应该能够处理BigInt转换', () => {
            expect(NumberExtension.toNumber(BigInt(42))).toBe(42);
            expect(NumberExtension.toNumber(BigInt(0))).toBe(0);
        });

        it('应该能够处理Infinity和-Infinity', () => {
            expect(NumberExtension.toNumber(Infinity)).toBe(Infinity);
            expect(NumberExtension.toNumber(-Infinity)).toBe(-Infinity);
            expect(NumberExtension.toNumber('Infinity')).toBe(Infinity);
            expect(NumberExtension.toNumber('-Infinity')).toBe(-Infinity);
        });

        it('对象转换应该调用valueOf或toString', () => {
            const objWithValueOf = {
                valueOf: () => 42
            };
            expect(NumberExtension.toNumber(objWithValueOf)).toBe(42);

            const objWithToString = {
                toString: () => '123'
            };
            expect(NumberExtension.toNumber(objWithToString)).toBe(123);
        });

        it('复杂对象应该返回NaN', () => {
            const complexObj = { a: 1, b: 2 };
            expect(Number.isNaN(NumberExtension.toNumber(complexObj))).toBe(true);
        });

        it('Symbol转换应该抛出错误', () => {
            expect(() => {
                NumberExtension.toNumber(Symbol('test'));
            }).toThrow();
        });

        it('应该处理特殊数值', () => {
            expect(NumberExtension.toNumber(Number.MAX_VALUE)).toBe(Number.MAX_VALUE);
            expect(NumberExtension.toNumber(Number.MIN_VALUE)).toBe(Number.MIN_VALUE);
            expect(NumberExtension.toNumber(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
            expect(NumberExtension.toNumber(Number.MIN_SAFE_INTEGER)).toBe(Number.MIN_SAFE_INTEGER);
        });

        it('应该处理parseFloat可解析的字符串', () => {
            // NumberExtension.toNumber使用Number()，不支持parseFloat的部分解析
            expect(Number.isNaN(NumberExtension.toNumber('42.5px'))).toBe(true);
            expect(Number.isNaN(NumberExtension.toNumber('100%'))).toBe(true);
            expect(Number.isNaN(NumberExtension.toNumber('3.14em'))).toBe(true);
        });

        it('边界情况测试', () => {
            // 非常大的数字
            expect(NumberExtension.toNumber('1e308')).toBe(1e308);
            
            // 非常小的数字
            expect(NumberExtension.toNumber('1e-308')).toBe(1e-308);
            
            // 精度问题
            expect(NumberExtension.toNumber('0.1')).toBe(0.1);
            expect(NumberExtension.toNumber('0.2')).toBe(0.2);
        });

        it('应该处理带符号的字符串', () => {
            expect(NumberExtension.toNumber('+42')).toBe(42);
            expect(NumberExtension.toNumber('+3.14')).toBe(3.14);
            expect(NumberExtension.toNumber('-0')).toBe(-0);
        });

        it('应该处理八进制字符串（不推荐使用）', () => {
            // 注意：现代JavaScript中八进制字面量是不推荐的
            expect(NumberExtension.toNumber('010')).toBe(10); // 被当作十进制处理
        });

    });

    describe('类型兼容性测试', () => {
        it('应该与Number()函数行为一致', () => {
            const testValues = [
                42, '42', true, false, '', '  ',
                '3.14', 'abc', [], [42], {}, Infinity, -Infinity
            ];

            testValues.forEach(value => {
                const extensionResult = NumberExtension.toNumber(value);
                const nativeResult = Number(value);
                
                if (Number.isNaN(extensionResult) && Number.isNaN(nativeResult)) {
                    // 两个都是NaN，认为相等
                    expect(true).toBe(true);
                } else {
                    expect(extensionResult).toBe(nativeResult);
                }
            });
            
            // 特殊处理null和undefined的情况
            expect(NumberExtension.toNumber(null)).toBe(0);
            expect(NumberExtension.toNumber(undefined)).toBe(0);
            expect(Number(null)).toBe(0);
            expect(Number(undefined)).toBeNaN();
        });

        it('应该正确处理特殊的相等性', () => {
            // -0 和 +0
            expect(Object.is(NumberExtension.toNumber('-0'), -0)).toBe(true);
            expect(Object.is(NumberExtension.toNumber('+0'), +0)).toBe(true);
            
            // NaN
            expect(Number.isNaN(NumberExtension.toNumber('notANumber'))).toBe(true);
        });
    });
});