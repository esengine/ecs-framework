/**
 * 高性能稀疏集合数据结构
 * 
 * SparseSet是ECS系统中常用的数据结构，提供O(1)的插入、删除和查找操作
 * 同时支持密集数组迭代，非常适合存储稀疏的实体组件数据
 */
pub struct SparseSet {
    /// 稀疏数组，索引到密集数组的映射
    sparse: Vec<Option<usize>>,
    
    /// 密集数组，存储实际的值
    dense: Vec<u32>,
    
    /// 当前元素数量
    size: usize,
}

impl SparseSet {
    /**
     * 创建新的稀疏集合
     */
    pub fn new() -> Self {
        Self {
            sparse: Vec::new(),
            dense: Vec::new(),
            size: 0,
        }
    }

    /**
     * 创建指定容量的稀疏集合
     */
    pub fn with_capacity(sparse_capacity: usize, dense_capacity: usize) -> Self {
        Self {
            sparse: vec![None; sparse_capacity],
            dense: Vec::with_capacity(dense_capacity),
            size: 0,
        }
    }

    /**
     * 插入值
     */
    pub fn insert(&mut self, value: u32) -> bool {
        let sparse_index = value as usize;

        // 确保稀疏数组足够大
        if sparse_index >= self.sparse.len() {
            self.sparse.resize(sparse_index + 1, None);
        }

        // 检查值是否已存在
        if self.sparse[sparse_index].is_some() {
            return false;
        }

        // 插入到密集数组
        let dense_index = self.size;
        if dense_index >= self.dense.len() {
            self.dense.push(value);
        } else {
            self.dense[dense_index] = value;
        }

        // 建立稀疏数组映射
        self.sparse[sparse_index] = Some(dense_index);
        self.size += 1;

        true
    }

    /**
     * 移除值
     */
    pub fn remove(&mut self, value: u32) -> bool {
        let sparse_index = value as usize;

        // 检查边界和存在性
        if sparse_index >= self.sparse.len() {
            return false;
        }

        let Some(dense_index) = self.sparse[sparse_index] else {
            return false;
        };

        // 移除稀疏数组映射
        self.sparse[sparse_index] = None;

        // 将最后一个元素移动到被删除位置（保持密集性）
        let last_index = self.size - 1;
        if dense_index != last_index {
            let last_value = self.dense[last_index];
            self.dense[dense_index] = last_value;
            
            // 更新被移动元素的稀疏数组映射
            self.sparse[last_value as usize] = Some(dense_index);
        }

        self.size -= 1;
        true
    }

    /**
     * 检查值是否存在
     */
    pub fn contains(&self, value: u32) -> bool {
        let sparse_index = value as usize;
        sparse_index < self.sparse.len() && self.sparse[sparse_index].is_some()
    }

    /**
     * 获取元素数量
     */
    pub fn len(&self) -> usize {
        self.size
    }

    /**
     * 检查是否为空
     */
    pub fn is_empty(&self) -> bool {
        self.size == 0
    }

    /**
     * 清空集合
     */
    pub fn clear(&mut self) {
        self.sparse.clear();
        self.dense.clear();
        self.size = 0;
    }

    /**
     * 获取密集数组的引用
     */
    pub fn dense(&self) -> &[u32] {
        &self.dense[0..self.size]
    }

    /**
     * 获取密集数组的可变引用
     */
    pub fn dense_mut(&mut self) -> &mut [u32] {
        &mut self.dense[0..self.size]
    }

    /**
     * 迭代所有值
     */
    pub fn iter(&self) -> impl Iterator<Item = u32> + '_ {
        self.dense[0..self.size].iter().copied()
    }

    /**
     * 批量插入
     */
    pub fn insert_batch(&mut self, values: &[u32]) {
        for &value in values {
            self.insert(value);
        }
    }

    /**
     * 获取值在密集数组中的索引
     */
    pub fn get_dense_index(&self, value: u32) -> Option<usize> {
        let sparse_index = value as usize;
        if sparse_index < self.sparse.len() {
            self.sparse[sparse_index]
        } else {
            None
        }
    }

    /**
     * 预分配容量
     */
    pub fn reserve(&mut self, sparse_capacity: usize, dense_capacity: usize) {
        if sparse_capacity > self.sparse.len() {
            self.sparse.resize(sparse_capacity, None);
        }
        if dense_capacity > self.dense.capacity() {
            self.dense.reserve(dense_capacity - self.dense.capacity());
        }
    }

    /**
     * 与另一个稀疏集合取交集
     */
    pub fn intersection(&self, other: &SparseSet) -> SparseSet {
        let mut result = SparseSet::new();
        
        for value in self.iter() {
            if other.contains(value) {
                result.insert(value);
            }
        }
        
        result
    }

    /**
     * 与另一个稀疏集合取并集
     */
    pub fn union(&self, other: &SparseSet) -> SparseSet {
        let mut result = SparseSet::new();
        
        // 添加当前集合的所有元素
        for value in self.iter() {
            result.insert(value);
        }
        
        // 添加另一个集合的所有元素
        for value in other.iter() {
            result.insert(value);
        }
        
        result
    }
}

impl Default for SparseSet {
    fn default() -> Self {
        Self::new()
    }
}

impl std::fmt::Debug for SparseSet {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("SparseSet")
            .field("size", &self.size)
            .field("sparse_len", &self.sparse.len())
            .field("dense_elements", &self.dense[0..self.size].to_vec())
            .finish()
    }
}