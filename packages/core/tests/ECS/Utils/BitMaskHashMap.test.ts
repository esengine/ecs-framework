// FlatHashMap.test.ts

import { BitMaskHashMap } from "../../../src/ECS/Utils/BitMaskHashMap";
import { BitMask64Data, BitMask64Utils } from "../../../src";

describe("FlatHashMap 基础功能", () => {
    test("set/get/has/delete 基本操作", () => {
        const map = new BitMaskHashMap<number>();
        const keyA = BitMask64Utils.create(5);
        const keyB = BitMask64Utils.create(63);

        map.set(keyA, 100);
        map.set(keyB, 200);

        expect(map.size).toBe(2);
        expect(map.get(keyA)).toBe(100);
        expect(map.get(keyB)).toBe(200);
        expect(map.has(keyA)).toBe(true);

        map.delete(keyA);
        expect(map.has(keyA)).toBe(false);
        expect(map.size).toBe(1);

        map.clear();
        expect(map.size).toBe(0);
    });

    test("覆盖 set 应该更新 value 而不是新增", () => {
        const map = new BitMaskHashMap<string>();
        const key = BitMask64Utils.create(10);

        map.set(key, "foo");
        map.set(key, "bar");

        expect(map.size).toBe(1);
        expect(map.get(key)).toBe("bar");
    });

    test("不同 key 产生相同 primaryHash 时应正确区分", () => {
        const map = new BitMaskHashMap<number>();

        // 伪造两个不同 key，理论上可能 hash 冲突
        // 为了测试，我们直接用两个高位 bit（分段不同）
        const keyA = BitMask64Utils.create(150);
        const keyB = BitMask64Utils.create(300);

        map.set(keyA, 111);
        map.set(keyB, 222);

        expect(map.get(keyA)).toBe(111);
        expect(map.get(keyB)).toBe(222);
        expect(map.size).toBe(2);
    });
    test("100000 个掩码连续的 key 不应存在冲突", () => {
        const map = new BitMaskHashMap<number>();
        const count = 100000;
        const mask: BitMask64Data = { base: [0,0] };
        for (let i = 0; i < count; i++) {
            let temp = i;
            // 遍历 i 的二进制表示的每一位
            let bitIndex = 0;
            while (temp > 0) {
                if (temp & 1) {
                    BitMask64Utils.setBit(mask, bitIndex);
                }
                temp = temp >>> 1; // 无符号右移一位，检查下一位
                bitIndex++;
            }
            map.set(mask,1);
        }
        // 预计没有任何冲突，每一个元素都在单独的桶中。
        expect(map.innerBuckets.size).toBe(map.size);
    });

});