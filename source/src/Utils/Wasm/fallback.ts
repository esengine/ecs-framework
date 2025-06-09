/**
 * JavaScript回退实现
 */

import { EntityId, ComponentMask, QueryResult, PerformanceStats } from './types';

export class JavaScriptFallback {
    private jsEntityMasks = new Map<EntityId, ComponentMask>();
    private jsNextEntityId = 1;
    private jsQueryCount = 0;
    private jsUpdateCount = 0;

    createEntity(): EntityId {
        const entityId = this.jsNextEntityId++;
        this.jsEntityMasks.set(entityId, 0n);
        return entityId;
    }

    destroyEntity(entityId: EntityId): boolean {
        return this.jsEntityMasks.delete(entityId);
    }

    updateEntityMask(entityId: EntityId, mask: ComponentMask): void {
        this.jsEntityMasks.set(entityId, mask);
        this.jsUpdateCount++;
    }

    batchUpdateMasks(entityIds: EntityId[], masks: ComponentMask[]): void {
        for (let i = 0; i < entityIds.length && i < masks.length; i++) {
            this.jsEntityMasks.set(entityIds[i], masks[i]);
        }
        this.jsUpdateCount += Math.min(entityIds.length, masks.length);
    }

    queryEntities(mask: ComponentMask, maxResults: number = 10000): QueryResult {
        const results: number[] = [];
        
        for (const [entityId, entityMask] of this.jsEntityMasks) {
            if ((entityMask & mask) === mask) {
                results.push(entityId);
                if (results.length >= maxResults) break;
            }
        }
        
        this.jsQueryCount++;
        return {
            entities: new Uint32Array(results),
            count: results.length
        };
    }

    queryCached(mask: ComponentMask): QueryResult {
        return this.queryEntities(mask);
    }
    queryMultipleComponents(masks: ComponentMask[], maxResults: number = 10000): QueryResult {
        const results: number[] = [];
        
        for (const [entityId, entityMask] of this.jsEntityMasks) {
            let matches = false;
            for (const mask of masks) {
                if ((entityMask & mask) === mask) {
                    matches = true;
                    break;
                }
            }
            if (matches) {
                results.push(entityId);
                if (results.length >= maxResults) break;
            }
        }
        
        this.jsQueryCount++;
        return {
            entities: new Uint32Array(results),
            count: results.length
        };
    }

    queryWithExclusion(includeMask: ComponentMask, excludeMask: ComponentMask, maxResults: number = 10000): QueryResult {
        const results: number[] = [];
        
        for (const [entityId, entityMask] of this.jsEntityMasks) {
            if ((entityMask & includeMask) === includeMask && (entityMask & excludeMask) === 0n) {
                results.push(entityId);
                if (results.length >= maxResults) break;
            }
        }
        
        this.jsQueryCount++;
        return {
            entities: new Uint32Array(results),
            count: results.length
        };
    }

    getEntityMask(entityId: EntityId): ComponentMask | null {
        return this.jsEntityMasks.get(entityId) || null;
    }

    entityExists(entityId: EntityId): boolean {
        return this.jsEntityMasks.has(entityId);
    }
    createComponentMask(componentIds: number[]): ComponentMask {
        let mask = 0n;
        for (const id of componentIds) {
            mask |= (1n << BigInt(id));
        }
        return mask;
    }

    maskContainsComponent(mask: ComponentMask, componentId: number): boolean {
        return (mask & (1n << BigInt(componentId))) !== 0n;
    }
    getPerformanceStats(): PerformanceStats {
        return {
            entityCount: this.jsEntityMasks.size,
            indexCount: 0,
            queryCount: this.jsQueryCount,
            updateCount: this.jsUpdateCount,
            wasmEnabled: false
        };
    }

    clear(): void {
        this.jsEntityMasks.clear();
        this.jsNextEntityId = 1;
        this.jsQueryCount = 0;
        this.jsUpdateCount = 0;
    }

    getEntityCount(): number {
        return this.jsEntityMasks.size;
    }
} 