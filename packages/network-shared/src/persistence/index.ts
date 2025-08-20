/**
 * 数据持久化模块导出
 */

// 数据持久化接口和实现
export { 
    IDataPersistence,
    DataType,
    QueryOptions,
    QueryResult,
    StorageConfig,
    BatchOptions,
    TransactionOptions,
    StorageStats,
    PersistenceEvents,
    MemoryDataPersistence,
    FileDataPersistence,
    DataPersistenceFactory
} from './DataPersistence';