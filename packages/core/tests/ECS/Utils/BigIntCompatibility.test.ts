import { BitMask64Data, BitMask64Utils } from "../../../src";

describe("BitMask64Utils 位掩码工具测试", () => {
    test("create() 应该在指定索引位置设置位", () => {
        const mask = BitMask64Utils.create(0);
        expect(mask.base[0]).toBe(1);
        expect(mask.base[1]).toBe(0);

        const mask2 = BitMask64Utils.create(33);
        expect(mask2.base[0]).toBe(0);
        expect(mask2.base[1]).toBe(0b10);
    });

    test("fromNumber() 应该把数值放入低32位", () => {
        const mask = BitMask64Utils.fromNumber(123456);
        expect(mask.base[0]).toBe(123456);
        expect(mask.base[1]).toBe(0);
    });

    test("setBit/getBit/clearBit 应该正确设置、读取和清除位", () => {
        const mask: BitMask64Data = { base: [0, 0] };

        BitMask64Utils.setBit(mask, 5);
        expect(BitMask64Utils.getBit(mask, 5)).toBe(true);

        BitMask64Utils.clearBit(mask, 5);
        expect(BitMask64Utils.getBit(mask, 5)).toBe(false);

        // 测试扩展段
        BitMask64Utils.setBit(mask, 70);
        expect(mask.segments).toBeDefined();
        expect(BitMask64Utils.getBit(mask, 70)).toBe(true);
    });

    test("hasAny/hasAll/hasNone 判断应正确", () => {
        const maskA = BitMask64Utils.create(1);
        const maskB = BitMask64Utils.create(1);
        const maskC = BitMask64Utils.create(2);

        expect(BitMask64Utils.hasAny(maskA, maskB)).toBe(true);
        expect(BitMask64Utils.hasAll(maskA, maskB)).toBe(true);
        expect(BitMask64Utils.hasNone(maskA, maskC)).toBe(true);
    });

    test("isZero 应正确判断", () => {
        const mask = BitMask64Utils.create(3);
        expect(BitMask64Utils.isZero(mask)).toBe(false);

        BitMask64Utils.clear(mask);
        expect(BitMask64Utils.isZero(mask)).toBe(true);
    });

    test("equals 应正确判断两个掩码是否相等", () => {
        const mask1 = BitMask64Utils.create(10);
        const mask2 = BitMask64Utils.create(10);
        const mask3 = BitMask64Utils.create(11);

        expect(BitMask64Utils.equals(mask1, mask2)).toBe(true);
        expect(BitMask64Utils.equals(mask1, mask3)).toBe(false);
    });

    test("orInPlace/andInPlace/xorInPlace 运算应正确", () => {
        const mask1 = BitMask64Utils.create(1);
        const mask2 = BitMask64Utils.create(2);

        BitMask64Utils.orInPlace(mask1, mask2);
        expect(BitMask64Utils.getBit(mask1, 1)).toBe(true);
        expect(BitMask64Utils.getBit(mask1, 2)).toBe(true);

        BitMask64Utils.andInPlace(mask1, mask2);
        expect(BitMask64Utils.getBit(mask1, 1)).toBe(false);
        expect(BitMask64Utils.getBit(mask1, 2)).toBe(true);

        BitMask64Utils.xorInPlace(mask1, mask2);
        expect(BitMask64Utils.getBit(mask1, 2)).toBe(false);
    });

    test("copy/clone 应正确复制数据", () => {
        const source = BitMask64Utils.create(15);
        const target: BitMask64Data = { base: [0, 0] };

        BitMask64Utils.copy(source, target);
        expect(BitMask64Utils.equals(source, target)).toBe(true);

        const clone = BitMask64Utils.clone(source);
        expect(BitMask64Utils.equals(source, clone)).toBe(true);
        expect(clone).not.toBe(source); // 深拷贝
    });

    test("越界与非法输入处理", () => {
        expect(() => BitMask64Utils.create(-1)).toThrow();
        expect(BitMask64Utils.getBit({ base: [0,0] }, -5)).toBe(false);
        expect(() => BitMask64Utils.clearBit({ base: [0,0] }, -2)).toThrow();
    });

    test("大于64位的扩展段逻辑 - hasAny/hasAll/hasNone/equals", () => {
        // 掩码 A: 只在 bit 150 位置为 1
        const maskA = BitMask64Utils.create(150);
        // 掩码 B: 只在 bit 200 位置为 1
        const maskB = BitMask64Utils.create(200);

        // A 与 B 在不同扩展段，不存在重叠位
        expect(BitMask64Utils.hasAny(maskA, maskB)).toBe(false);
        expect(BitMask64Utils.hasNone(maskA, maskB)).toBe(true);

        // C: 在 150 与 200 都置位
        const maskC = BitMask64Utils.clone(maskA);
        BitMask64Utils.setBit(maskC, 200);

        // A 是 C 的子集
        expect(BitMask64Utils.hasAll(maskC, maskA)).toBe(true);
        // B 是 C 的子集
        expect(BitMask64Utils.hasAll(maskC, maskB)).toBe(true);

        // A 和 C 不相等
        expect(BitMask64Utils.equals(maskA, maskC)).toBe(false);

        // C 与自身相等
        expect(BitMask64Utils.equals(maskC, maskC)).toBe(true);

        //copy
        const copyMask = BitMask64Utils.create(0);
        BitMask64Utils.copy(maskA,copyMask);
        expect(BitMask64Utils.equals(copyMask,maskA)).toBe(true);

        // hasAll短路测试，对第一个if的测试覆盖
        BitMask64Utils.setBit(copyMask,64);
        expect(BitMask64Utils.hasAll(maskA, copyMask)).toBe(false);
        BitMask64Utils.clearBit(copyMask, 64);

        // 扩展到350位，对最后一个短路if的测试覆盖
        BitMask64Utils.setBit(copyMask,350);
        expect(BitMask64Utils.hasAll(maskA, copyMask)).toBe(false);
    });

    test("大于64位的逻辑运算 - or/and/xor 跨段处理", () => {
        const maskA = BitMask64Utils.create(128); // 第一扩展段
        const maskB = BitMask64Utils.create(190); // 同一扩展段但不同位置
        const maskC = BitMask64Utils.create(300); // 不同扩展段

        // OR: 合并不同扩展段
        const orMask = BitMask64Utils.clone(maskA);
        BitMask64Utils.orInPlace(orMask, maskC);
        expect(BitMask64Utils.getBit(orMask, 128)).toBe(true);
        expect(BitMask64Utils.getBit(orMask, 300)).toBe(true);

        // AND: 交集为空
        const andMask = BitMask64Utils.clone(maskA);
        BitMask64Utils.andInPlace(andMask, maskB);
        expect(BitMask64Utils.isZero(andMask)).toBe(true);

        // XOR: 不同扩展段应该都保留
        const xorMask = BitMask64Utils.clone(maskA);
        BitMask64Utils.xorInPlace(xorMask, maskC);
        expect(BitMask64Utils.getBit(xorMask, 128)).toBe(true);
        expect(BitMask64Utils.getBit(xorMask, 300)).toBe(true);
    });

    test("toString 与 popCount 应该在扩展段正常工作", () => {
        const mask = BitMask64Utils.create(0);
        BitMask64Utils.setBit(mask, 130);       // 扩展段,此时扩展段长度延长到2
        BitMask64Utils.setBit(mask, 260);       // 再设置另一个超出当前最高段范围更高位,此时扩展段长度延长到3
        // 现在应该有三个置位
        expect(BitMask64Utils.popCount(mask)).toBe(3);


        const strBin = BitMask64Utils.toString(mask, 2);
        const strHex = BitMask64Utils.toString(mask, 16);
        // 第三个区段应该以100结尾（130位为1）
        expect(strBin.split(' ')[2].endsWith('100')).toBe(true);
        // 不存在高位的第三个区段字符串应为0x4
        expect(strHex.split(' ')[2]).toBe('0x4');

        // 设置第244位为1 这是第四个区段的第(256 - 244 =)12位
        BitMask64Utils.setBit(mask, 244);
        // 四个区段的在二进制下第12位的字符串应为'1'
        expect(BitMask64Utils.toString(mask, 2).split(' ')[3][11]).toBe('1');
        // 第四个区段的十六进制下所有字符串应为'0x10000000000000',即二进制的'10000 00000000 00000000 00000000 00000000 00000000 00000000'
        expect(BitMask64Utils.toString(mask, 16).split(' ')[3]).toBe('0x10000000000000');
    });

});

