use std::any::TypeId;

/**
 * 组件类型标识符
 * 在Rust中使用TypeId来标识组件类型
 */
pub type ComponentType = TypeId;

/**
 * 查询条件结构
 * 定义实体查询的所有条件类型
 */
#[derive(Debug, Clone)]
pub struct QueryCondition {
    /// 必须包含所有这些组件
    pub all: Vec<ComponentType>,
    /// 必须包含至少一个这些组件
    pub any: Vec<ComponentType>,
    /// 不能包含任何这些组件
    pub none: Vec<ComponentType>,
    /// 按标签查询
    pub tag: Option<u32>,
    /// 按名称查询
    pub name: Option<String>,
    /// 单组件查询
    pub component: Option<ComponentType>,
}

impl Default for QueryCondition {
    fn default() -> Self {
        Self {
            all: Vec::new(),
            any: Vec::new(),
            none: Vec::new(),
            tag: None,
            name: None,
            component: None,
        }
    }
}

/**
 * 实体匹配条件描述符
 * 
 * 用于描述实体查询条件，不执行实际查询
 * 支持链式调用构建复杂查询条件
 */
#[derive(Debug)]
pub struct Matcher {
    condition: QueryCondition,
}

impl Matcher {
    /**
     * 创建新的匹配器
     */
    pub fn new() -> Self {
        Self {
            condition: QueryCondition::default(),
        }
    }

    // ========== 静态构造方法 ==========

    /**
     * 创建匹配器，要求所有指定的组件
     */
    pub fn all_of(component_types: &[ComponentType]) -> Self {
        let mut matcher = Self::new();
        matcher.all_of_types(component_types);
        matcher
    }

    /**
     * 创建匹配器，要求至少一个指定的组件
     */
    pub fn any_of(component_types: &[ComponentType]) -> Self {
        let mut matcher = Self::new();
        matcher.any_of_types(component_types);
        matcher
    }

    /**
     * 创建匹配器，排除指定的组件
     */
    pub fn none_of(component_types: &[ComponentType]) -> Self {
        let mut matcher = Self::new();
        matcher.none_of_types(component_types);
        matcher
    }

    /**
     * 创建按标签查询的匹配器
     */
    pub fn by_tag(tag: u32) -> Self {
        let mut matcher = Self::new();
        matcher.with_tag(tag);
        matcher
    }

    /**
     * 创建按名称查询的匹配器
     */
    pub fn by_name(name: String) -> Self {
        let mut matcher = Self::new();
        matcher.with_name(name);
        matcher
    }

    /**
     * 创建单组件查询的匹配器
     */
    pub fn by_component(component_type: ComponentType) -> Self {
        let mut matcher = Self::new();
        matcher.with_component(component_type);
        matcher
    }

    /**
     * 创建复杂查询构建器
     */
    pub fn complex() -> Self {
        Self::new()
    }

    /**
     * 创建空匹配器（向后兼容）
     */
    pub fn empty() -> Self {
        Self::new()
    }

    // ========== 链式构建方法 ==========

    /**
     * 必须包含所有指定组件
     */
    pub fn all_of_types(&mut self, component_types: &[ComponentType]) -> &mut Self {
        self.condition.all.extend_from_slice(component_types);
        self
    }

    /**
     * 必须包含所有指定组件（单个组件版本）
     */
    pub fn all(&mut self, component_type: ComponentType) -> &mut Self {
        self.condition.all.push(component_type);
        self
    }

    /**
     * 必须包含至少一个指定组件
     */
    pub fn any_of_types(&mut self, component_types: &[ComponentType]) -> &mut Self {
        self.condition.any.extend_from_slice(component_types);
        self
    }

    /**
     * 必须包含至少一个指定组件（单个组件版本）
     */
    pub fn any(&mut self, component_type: ComponentType) -> &mut Self {
        self.condition.any.push(component_type);
        self
    }

    /**
     * 不能包含任何指定组件
     */
    pub fn none_of_types(&mut self, component_types: &[ComponentType]) -> &mut Self {
        self.condition.none.extend_from_slice(component_types);
        self
    }

    /**
     * 不能包含指定组件（单个组件版本）
     */
    pub fn none(&mut self, component_type: ComponentType) -> &mut Self {
        self.condition.none.push(component_type);
        self
    }

    /**
     * 排除指定组件（别名方法）
     */
    pub fn exclude(&mut self, component_type: ComponentType) -> &mut Self {
        self.none(component_type)
    }

    /**
     * 至少包含其中之一（别名方法）
     */
    pub fn one(&mut self, component_type: ComponentType) -> &mut Self {
        self.any(component_type)
    }

    /**
     * 按标签查询
     */
    pub fn with_tag(&mut self, tag: u32) -> &mut Self {
        self.condition.tag = Some(tag);
        self
    }

    /**
     * 按名称查询
     */
    pub fn with_name(&mut self, name: String) -> &mut Self {
        self.condition.name = Some(name);
        self
    }

    /**
     * 单组件查询
     */
    pub fn with_component(&mut self, component_type: ComponentType) -> &mut Self {
        self.condition.component = Some(component_type);
        self
    }

    /**
     * 移除标签条件
     */
    pub fn without_tag(&mut self) -> &mut Self {
        self.condition.tag = None;
        self
    }

    /**
     * 移除名称条件
     */
    pub fn without_name(&mut self) -> &mut Self {
        self.condition.name = None;
        self
    }

    /**
     * 移除单组件条件
     */
    pub fn without_component(&mut self) -> &mut Self {
        self.condition.component = None;
        self
    }

    // ========== 查询和工具方法 ==========

    /**
     * 获取查询条件（只读）
     */
    pub fn get_condition(&self) -> &QueryCondition {
        &self.condition
    }

    /**
     * 获取查询条件的克隆
     */
    pub fn clone_condition(&self) -> QueryCondition {
        self.condition.clone()
    }

    /**
     * 检查是否为空条件
     */
    pub fn is_empty(&self) -> bool {
        self.condition.all.is_empty() &&
        self.condition.any.is_empty() &&
        self.condition.none.is_empty() &&
        self.condition.tag.is_none() &&
        self.condition.name.is_none() &&
        self.condition.component.is_none()
    }

    /**
     * 重置所有条件
     */
    pub fn reset(&mut self) -> &mut Self {
        self.condition.all.clear();
        self.condition.any.clear();
        self.condition.none.clear();
        self.condition.tag = None;
        self.condition.name = None;
        self.condition.component = None;
        self
    }

    /**
     * 克隆匹配器
     */
    pub fn clone(&self) -> Self {
        Self {
            condition: self.condition.clone(),
        }
    }

    /**
     * 获取所有条件的组件类型数量（用于性能分析）
     */
    pub fn component_type_count(&self) -> usize {
        self.condition.all.len() + 
        self.condition.any.len() + 
        self.condition.none.len() +
        if self.condition.component.is_some() { 1 } else { 0 }
    }

    /**
     * 检查查询条件的复杂度
     */
    pub fn complexity_level(&self) -> u32 {
        let mut level = 0;
        
        if !self.condition.all.is_empty() { level += 1; }
        if !self.condition.any.is_empty() { level += 2; }
        if !self.condition.none.is_empty() { level += 1; }
        if self.condition.tag.is_some() { level += 1; }
        if self.condition.name.is_some() { level += 1; }
        if self.condition.component.is_some() { level += 1; }

        level
    }
}

impl Default for Matcher {
    fn default() -> Self {
        Self::new()
    }
}

/**
 * 用于测试和调试的方法
 */
impl Matcher {
    /**
     * 格式化为调试字符串
     */
    pub fn debug_string(&self) -> String {
        let mut parts = Vec::new();
        
        if !self.condition.all.is_empty() {
            parts.push(format!("all({} types)", self.condition.all.len()));
        }
        
        if !self.condition.any.is_empty() {
            parts.push(format!("any({} types)", self.condition.any.len()));
        }
        
        if !self.condition.none.is_empty() {
            parts.push(format!("none({} types)", self.condition.none.len()));
        }
        
        if let Some(tag) = self.condition.tag {
            parts.push(format!("tag({})", tag));
        }
        
        if let Some(ref name) = self.condition.name {
            parts.push(format!("name({})", name));
        }
        
        if self.condition.component.is_some() {
            parts.push("component(1 type)".to_string());
        }
        
        if parts.is_empty() {
            "Matcher[empty]".to_string()
        } else {
            format!("Matcher[{}]", parts.join(" & "))
        }
    }
}

// 实现Display trait以支持打印
impl std::fmt::Display for Matcher {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.debug_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::any::TypeId;
    
    // 测试用的示例组件
    struct TestComponent1;
    struct TestComponent2;
    struct TestComponent3;

    #[test]
    fn test_matcher_all() {
        let mut matcher = Matcher::new();
        matcher.all(TypeId::of::<TestComponent1>())
               .all(TypeId::of::<TestComponent2>());
        
        assert_eq!(matcher.get_condition().all.len(), 2);
        assert!(!matcher.is_empty());
    }

    #[test]
    fn test_matcher_any() {
        let mut matcher = Matcher::new();
        matcher.any(TypeId::of::<TestComponent1>())
               .any(TypeId::of::<TestComponent2>());
        
        assert_eq!(matcher.get_condition().any.len(), 2);
    }

    #[test]
    fn test_matcher_none() {
        let mut matcher = Matcher::new();
        matcher.none(TypeId::of::<TestComponent1>());
        
        assert_eq!(matcher.get_condition().none.len(), 1);
    }

    #[test]
    fn test_matcher_complex() {
        let mut matcher = Matcher::complex();
        matcher.all(TypeId::of::<TestComponent1>())
               .any(TypeId::of::<TestComponent2>())
               .none(TypeId::of::<TestComponent3>())
               .with_tag(42)
               .with_name("test_entity".to_string());
        
        assert_eq!(matcher.complexity_level(), 6);
        assert!(!matcher.is_empty());
    }

    #[test]
    fn test_matcher_static_constructors() {
        let types = vec![TypeId::of::<TestComponent1>(), TypeId::of::<TestComponent2>()];
        let matcher = Matcher::all_of(&types);
        assert_eq!(matcher.get_condition().all.len(), 2);
    }

    #[test]
    fn test_matcher_reset() {
        let mut matcher = Matcher::new();
        matcher.all(TypeId::of::<TestComponent1>())
               .with_tag(42);
        
        assert!(!matcher.is_empty());
        
        matcher.reset();
        assert!(matcher.is_empty());
    }

    #[test]
    fn test_matcher_clone() {
        let mut matcher = Matcher::new();
        matcher.all(TypeId::of::<TestComponent1>())
               .with_tag(42);
        
        let cloned = matcher.clone();
        assert_eq!(cloned.get_condition().all.len(), 1);
        assert_eq!(cloned.get_condition().tag, Some(42));
    }
}