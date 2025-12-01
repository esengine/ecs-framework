import {
    EntityTags,
    hasEntityTag,
    addEntityTag,
    removeEntityTag,
    isFolder,
    isHidden,
    isLocked
} from '../../src/ECS/EntityTags';

describe('EntityTags', () => {
    describe('tag constants', () => {
        test('should have correct NONE value', () => {
            expect(EntityTags.NONE).toBe(0x0000);
        });

        test('should have correct FOLDER value', () => {
            expect(EntityTags.FOLDER).toBe(0x1000);
        });

        test('should have correct HIDDEN value', () => {
            expect(EntityTags.HIDDEN).toBe(0x2000);
        });

        test('should have correct LOCKED value', () => {
            expect(EntityTags.LOCKED).toBe(0x4000);
        });

        test('should have correct EDITOR_ONLY value', () => {
            expect(EntityTags.EDITOR_ONLY).toBe(0x8000);
        });

        test('should have correct PREFAB_INSTANCE value', () => {
            expect(EntityTags.PREFAB_INSTANCE).toBe(0x0100);
        });

        test('should have correct PREFAB_ROOT value', () => {
            expect(EntityTags.PREFAB_ROOT).toBe(0x0200);
        });

        test('all tags should have unique values', () => {
            const values = Object.values(EntityTags).filter((v) => typeof v === 'number');
            const uniqueValues = new Set(values);
            expect(uniqueValues.size).toBe(values.length);
        });
    });

    describe('hasEntityTag', () => {
        test('should return true when tag is present', () => {
            const tag = EntityTags.FOLDER;
            expect(hasEntityTag(tag, EntityTags.FOLDER)).toBe(true);
        });

        test('should return false when tag is not present', () => {
            const tag = EntityTags.FOLDER;
            expect(hasEntityTag(tag, EntityTags.HIDDEN)).toBe(false);
        });

        test('should work with combined tags', () => {
            const combined = EntityTags.FOLDER | EntityTags.HIDDEN | EntityTags.LOCKED;

            expect(hasEntityTag(combined, EntityTags.FOLDER)).toBe(true);
            expect(hasEntityTag(combined, EntityTags.HIDDEN)).toBe(true);
            expect(hasEntityTag(combined, EntityTags.LOCKED)).toBe(true);
            expect(hasEntityTag(combined, EntityTags.EDITOR_ONLY)).toBe(false);
        });

        test('should return false for NONE tag', () => {
            const tag = EntityTags.NONE;
            expect(hasEntityTag(tag, EntityTags.FOLDER)).toBe(false);
        });
    });

    describe('addEntityTag', () => {
        test('should add tag to empty tags', () => {
            const result = addEntityTag(EntityTags.NONE, EntityTags.FOLDER);
            expect(result).toBe(EntityTags.FOLDER);
        });

        test('should add tag to existing tags', () => {
            const existing = EntityTags.FOLDER as number;
            const result = addEntityTag(existing, EntityTags.HIDDEN);

            expect(hasEntityTag(result, EntityTags.FOLDER)).toBe(true);
            expect(hasEntityTag(result, EntityTags.HIDDEN)).toBe(true);
        });

        test('should not change value when adding same tag', () => {
            const existing = EntityTags.FOLDER as number;
            const result = addEntityTag(existing, EntityTags.FOLDER);

            expect(result).toBe(EntityTags.FOLDER);
        });

        test('should handle multiple tag additions', () => {
            let tag: number = EntityTags.NONE;
            tag = addEntityTag(tag, EntityTags.FOLDER);
            tag = addEntityTag(tag, EntityTags.HIDDEN);
            tag = addEntityTag(tag, EntityTags.LOCKED);

            expect(hasEntityTag(tag, EntityTags.FOLDER)).toBe(true);
            expect(hasEntityTag(tag, EntityTags.HIDDEN)).toBe(true);
            expect(hasEntityTag(tag, EntityTags.LOCKED)).toBe(true);
        });
    });

    describe('removeEntityTag', () => {
        test('should remove tag from combined tags', () => {
            const combined = (EntityTags.FOLDER | EntityTags.HIDDEN) as number;
            const result = removeEntityTag(combined, EntityTags.HIDDEN);

            expect(hasEntityTag(result, EntityTags.FOLDER)).toBe(true);
            expect(hasEntityTag(result, EntityTags.HIDDEN)).toBe(false);
        });

        test('should return same value when removing non-existent tag', () => {
            const existing = EntityTags.FOLDER as number;
            const result = removeEntityTag(existing, EntityTags.HIDDEN);

            expect(result).toBe(EntityTags.FOLDER);
        });

        test('should return NONE when removing last tag', () => {
            const result = removeEntityTag(EntityTags.FOLDER, EntityTags.FOLDER);
            expect(result).toBe(EntityTags.NONE);
        });

        test('should handle multiple tag removals', () => {
            let tag: number = EntityTags.FOLDER | EntityTags.HIDDEN | EntityTags.LOCKED;
            tag = removeEntityTag(tag, EntityTags.FOLDER);
            tag = removeEntityTag(tag, EntityTags.LOCKED);

            expect(hasEntityTag(tag, EntityTags.FOLDER)).toBe(false);
            expect(hasEntityTag(tag, EntityTags.HIDDEN)).toBe(true);
            expect(hasEntityTag(tag, EntityTags.LOCKED)).toBe(false);
        });
    });

    describe('isFolder', () => {
        test('should return true for folder tag', () => {
            expect(isFolder(EntityTags.FOLDER)).toBe(true);
        });

        test('should return true for combined tags including folder', () => {
            const combined = EntityTags.FOLDER | EntityTags.HIDDEN;
            expect(isFolder(combined)).toBe(true);
        });

        test('should return false for non-folder tag', () => {
            expect(isFolder(EntityTags.HIDDEN)).toBe(false);
            expect(isFolder(EntityTags.NONE)).toBe(false);
        });
    });

    describe('isHidden', () => {
        test('should return true for hidden tag', () => {
            expect(isHidden(EntityTags.HIDDEN)).toBe(true);
        });

        test('should return true for combined tags including hidden', () => {
            const combined = EntityTags.FOLDER | EntityTags.HIDDEN;
            expect(isHidden(combined)).toBe(true);
        });

        test('should return false for non-hidden tag', () => {
            expect(isHidden(EntityTags.FOLDER)).toBe(false);
            expect(isHidden(EntityTags.NONE)).toBe(false);
        });
    });

    describe('isLocked', () => {
        test('should return true for locked tag', () => {
            expect(isLocked(EntityTags.LOCKED)).toBe(true);
        });

        test('should return true for combined tags including locked', () => {
            const combined = EntityTags.FOLDER | EntityTags.LOCKED;
            expect(isLocked(combined)).toBe(true);
        });

        test('should return false for non-locked tag', () => {
            expect(isLocked(EntityTags.FOLDER)).toBe(false);
            expect(isLocked(EntityTags.NONE)).toBe(false);
        });
    });

    describe('tag combinations', () => {
        test('should correctly combine and identify multiple tags', () => {
            const tag = (EntityTags.FOLDER | EntityTags.HIDDEN | EntityTags.PREFAB_ROOT) as number;

            expect(isFolder(tag)).toBe(true);
            expect(isHidden(tag)).toBe(true);
            expect(hasEntityTag(tag, EntityTags.PREFAB_ROOT)).toBe(true);
            expect(isLocked(tag)).toBe(false);
        });

        test('should support complex add/remove operations', () => {
            let tag: number = EntityTags.NONE;

            // Add tags
            tag = addEntityTag(tag, EntityTags.FOLDER);
            tag = addEntityTag(tag, EntityTags.HIDDEN);
            tag = addEntityTag(tag, EntityTags.LOCKED);
            tag = addEntityTag(tag, EntityTags.EDITOR_ONLY);

            expect(isFolder(tag)).toBe(true);
            expect(isHidden(tag)).toBe(true);
            expect(isLocked(tag)).toBe(true);
            expect(hasEntityTag(tag, EntityTags.EDITOR_ONLY)).toBe(true);

            // Remove some tags
            tag = removeEntityTag(tag, EntityTags.HIDDEN);
            tag = removeEntityTag(tag, EntityTags.LOCKED);

            expect(isFolder(tag)).toBe(true);
            expect(isHidden(tag)).toBe(false);
            expect(isLocked(tag)).toBe(false);
            expect(hasEntityTag(tag, EntityTags.EDITOR_ONLY)).toBe(true);
        });

        test('should work correctly with prefab tags', () => {
            const prefabInstanceTag = EntityTags.PREFAB_INSTANCE as number;
            const prefabRootTag = EntityTags.PREFAB_ROOT as number;

            expect(hasEntityTag(prefabInstanceTag, EntityTags.PREFAB_INSTANCE)).toBe(true);
            expect(hasEntityTag(prefabInstanceTag, EntityTags.PREFAB_ROOT)).toBe(false);

            expect(hasEntityTag(prefabRootTag, EntityTags.PREFAB_ROOT)).toBe(true);
            expect(hasEntityTag(prefabRootTag, EntityTags.PREFAB_INSTANCE)).toBe(false);

            // Combine both
            const combined = (prefabInstanceTag | prefabRootTag) as number;
            expect(hasEntityTag(combined, EntityTags.PREFAB_INSTANCE)).toBe(true);
            expect(hasEntityTag(combined, EntityTags.PREFAB_ROOT)).toBe(true);
        });
    });
});
