# Changelog

This document records the version update history of the `@esengine/ecs-framework` core library.

---

## v2.3.1 (2025-12-07)

### Bug Fixes

- **Type export fix**: Fix type export issues in v2.3.0
  - Resolve `ServiceToken` cross-package type compatibility issues
  - Fix type references in `editor-app` and `behavior-tree-editor`

---

## v2.3.0 (2025-12-06) ⚠️ DEPRECATED

> **Warning**: This version has type export issues. Please upgrade to v2.3.1 or later.

### Features

- **Persistent Entity**: Add entity cross-scene migration support (#285)
  - New `EEntityLifecyclePolicy` enum (`SceneLocal`/`Persistent`)
  - Entity adds `setPersistent()`, `setSceneLocal()`, `isPersistent` API
  - Scene adds `findPersistentEntities()`, `extractPersistentEntities()`, `receiveMigratedEntities()`
  - `SceneManager.setScene()` automatically handles persistent entity migration
  - Use cases: global managers, player characters, cross-scene state persistence

- **CommandBuffer Deferred Command System**: Execute entity operations uniformly at end of frame (#281)
  - Support deferred add/remove components, destroy entities, set entity active state
  - Each system has its own `commands` property
  - Avoid modifying entity list during iteration, preventing iteration issues
  - Scene automatically flushes all command buffers after `lateUpdate`

### Performance

- **ReactiveQuery Snapshot Optimization**: Optimize entity query iteration performance (#281)
  - Add snapshot mechanism to avoid copying arrays every frame
  - Only create new snapshots when entity list changes
  - Multiple systems share the same snapshot in static scenes

---

## v2.2.21 (2025-12-05)

### Bug Fixes

- **Iteration safety fix**: Fix issue where component changes during `process`/`lateProcess` iteration caused entities to be skipped (#272)
  - Adding/removing components during system processing no longer causes entities to be unexpectedly skipped

### Performance

- **HierarchySystem optimization**: Optimize hierarchy system to avoid iterating all entities every frame (#279)
  - Use dirty entity set instead of iterating all entities
  - Static scene `process()` optimized from O(n) to O(1)
  - 1000 entities static scene: 81.79μs → 0.07μs (1168x faster)
  - 10000 entities static scene: 939.43μs → 0.56μs (1677x faster)
  - Server simulation (100 rooms x 100 entities): 2.7ms → 1.4ms per tick

---

## v2.2.20 (2025-12-04)

### Bug Fixes

- **System onAdded callback fix**: Fix issue where system `onAdded` callback was affected by registration order (#270)
  - System initialization now triggers `onAdded` callback for existing matching entities
  - Added `matchesEntity(entity)` method to check if an entity matches the system's query condition
  - Scene added `notifySystemsEntityAdded/Removed` methods to ensure all systems receive entity change notifications

---

## v2.2.19 (2025-12-03)

### Features

- **System stable sorting**: Add stable sorting support for systems (#257)
  - Added `addOrder` property for stable sorting when `updateOrder` is the same
  - Ensures systems with same priority execute in add order

- **Module configuration**: Add `module.json` configuration file (#256)
  - Define module ID, name, version and other metadata
  - Support module dependency declaration and export configuration

---

## v2.2.18 (2025-11-30)

### Features

- **Advanced Performance Profiler**: Implement new performance analysis SDK (#248)
  - `ProfilerSDK`: Unified performance analysis interface
    - Manual sampling markers (`beginSample`/`endSample`)
    - Automatic scope measurement (`measure`/`measureAsync`)
    - Call hierarchy tracking and call graph generation
    - Counter and gauge support
  - `AdvancedProfilerCollector`: Advanced performance data collector
    - Frame time statistics and history
    - Memory snapshots and GC detection
    - Long task detection (Long Task API)
    - Performance report generation
  - `DebugManager`: Debug manager
    - Unified debug tool entry point
    - Profiler integration

- **Property decorator enhancement**: Extend `@serialize` decorator functionality (#247)
  - Support more serialization option configurations

### Improvements

- **EntitySystem test coverage**: Add complete system test cases (#240)
  - Cover entity query, cache, lifecycle scenarios

- **Matcher enhancement**: Optimize matcher functionality (#240)
  - Improved matching logic and performance

---

## v2.2.17 (2025-11-28)

### Features

- **ComponentRegistry enhancement**: Add new component registry features (#244)
  - Support registering and querying component types by name
  - Add component mask caching for performance optimization

- **Serialization decorator improvements**: Enhance `@serialize` decorator (#244)
  - Support more flexible serialization configuration
  - Improved nested object serialization

- **EntitySystem lifecycle**: Add new system lifecycle methods (#244)
  - `onSceneStart()`: Called when scene starts
  - `onSceneStop()`: Called when scene stops

---

## v2.2.16 (2025-11-27)

### Features

- **Component lifecycle**: Add component lifecycle callback support (#237)
  - `onDeserialized()`: Called after component is loaded from scene file or snapshot restore, used to restore runtime data

- **ServiceContainer enhancement**: Improve service container functionality (#237)
  - Support `Symbol.for()` pattern for service identifiers
  - Added `@InjectProperty` property injection decorator
  - Improved service resolution and lifecycle management

- **SceneSerializer enhancement**: New scene serializer features (#237)
  - Support serialization of more component types
  - Improved deserialization error handling

- **Property decorator extension**: Extend `@serialize` decorator (#238)
  - Support `@range`, `@slider` and other editor hints
  - Support `@dropdown`, `@color` and other UI types
  - Support `@asset` resource reference type

### Improvements

- **Matcher tests**: Add Matcher test cases (#240)
- **EntitySystem tests**: Add complete entity system test coverage (#240)

---

## Version Notes

- **Major version**: Breaking changes
- **Minor version**: New features (backward compatible)
- **Patch version**: Bug fixes and improvements

## Related Links

- [GitHub Releases](https://github.com/esengine/ecs-framework/releases)
- [NPM Package](https://www.npmjs.com/package/@esengine/ecs-framework)
- [Documentation Home](./index.md)
