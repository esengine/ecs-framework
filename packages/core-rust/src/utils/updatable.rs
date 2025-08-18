use std::any::Any;
use std::marker::PhantomData;

/**
 * 可更新接口
 * 当添加到组件时，只要组件和实体被启用，就会在每帧调用update方法
 */
pub trait IUpdatable: Send + Sync {
    /**
     * 检查是否启用
     */
    fn is_enabled(&self) -> bool;
    
    /**
     * 获取更新顺序
     */
    fn get_update_order(&self) -> i32;
    
    /**
     * 更新方法，每帧调用
     */
    fn update(&mut self);
    
    /**
     * 转换为Any trait对象（用于类型转换）
     */
    fn as_any(&self) -> &dyn Any;
    
    /**
     * 转换为可变的Any trait对象（用于类型转换）
     */
    fn as_any_mut(&mut self) -> &mut dyn Any;
}

/**
 * 用于比较组件更新排序的比较器
 */
pub struct IUpdatableComparer;

impl IUpdatableComparer {
    /**
     * 比较两个IUpdatable对象的更新顺序
     */
    pub fn compare(a: &dyn IUpdatable, b: &dyn IUpdatable) -> std::cmp::Ordering {
        a.get_update_order().cmp(&b.get_update_order())
    }
}

/**
 * 检查对象是否实现了IUpdatable接口
 * 注意：此函数目前无法在运行时动态检查，仅作为编译时类型检查的辅助
 */
pub fn is_updatable<T: IUpdatable>(_obj: &T) -> bool {
    true
}

/**
 * 场景组件基类
 * 附加到场景的组件，用于实现场景级别的功能
 */
pub struct SceneComponent {
    /// 场景ID（用于标识所属场景，避免原始指针的线程安全问题）
    pub scene_id: Option<u32>,
    /// 更新顺序
    pub update_order: i32,
    /// 是否启用
    enabled: bool,
    /// 线程安全标记
    _phantom: PhantomData<*const ()>,
}

impl SceneComponent {
    /**
     * 创建新的场景组件
     */
    pub fn new() -> Self {
        Self {
            scene_id: None,
            update_order: 0,
            enabled: true,
            _phantom: PhantomData,
        }
    }

    /**
     * 创建带有指定更新顺序的场景组件
     */
    pub fn with_update_order(update_order: i32) -> Self {
        Self {
            scene_id: None,
            update_order,
            enabled: true,
            _phantom: PhantomData,
        }
    }

    /**
     * 获取是否启用
     */
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /**
     * 设置是否启用
     */
    pub fn set_enabled(&mut self, enabled: bool) {
        if self.enabled != enabled {
            self.enabled = enabled;
            if self.enabled {
                self.on_enabled();
            } else {
                self.on_disabled();
            }
        }
    }

    /**
     * 获取更新顺序
     */
    pub fn get_update_order(&self) -> i32 {
        self.update_order
    }

    /**
     * 设置更新顺序
     */
    pub fn set_update_order(&mut self, order: i32) {
        self.update_order = order;
    }

    /**
     * 获取所属场景ID
     */
    pub fn get_scene_id(&self) -> Option<u32> {
        self.scene_id
    }

    /**
     * 设置所属场景ID（内部方法，由Scene调用）
     */
    pub fn set_scene_id(&mut self, scene_id: Option<u32>) {
        self.scene_id = scene_id;
    }

    /**
     * 当组件启用时调用（虚方法，由子类重写）
     */
    pub fn on_enabled(&mut self) {
        // 默认实现为空，由子类重写
    }

    /**
     * 当组件禁用时调用（虚方法，由子类重写）
     */
    pub fn on_disabled(&mut self) {
        // 默认实现为空，由子类重写
    }

    /**
     * 当组件从场景中移除时调用（虚方法，由子类重写）
     */
    pub fn on_removed_from_scene(&mut self) {
        // 默认实现为空，由子类重写
        self.scene_id = None;
    }

    /**
     * 每帧更新（虚方法，由子类重写）
     */
    pub fn update(&mut self) {
        // 默认实现为空，由子类重写
    }

    /**
     * 比较组件的更新顺序
     */
    pub fn compare(&self, other: &SceneComponent) -> std::cmp::Ordering {
        self.update_order.cmp(&other.update_order)
    }
}

impl Default for SceneComponent {
    fn default() -> Self {
        Self::new()
    }
}

// 显式实现Send和Sync，因为PhantomData<*const ()>默认不实现这些traits
unsafe impl Send for SceneComponent {}
unsafe impl Sync for SceneComponent {}

impl IUpdatable for SceneComponent {
    fn is_enabled(&self) -> bool {
        self.enabled
    }

    fn get_update_order(&self) -> i32 {
        self.update_order
    }

    fn update(&mut self) {
        SceneComponent::update(self);
    }

    fn as_any(&self) -> &dyn Any {
        self
    }

    fn as_any_mut(&mut self) -> &mut dyn Any {
        self
    }
}

/**
 * 可更新对象管理器
 * 负责管理和更新实现了IUpdatable接口的对象
 */
pub struct UpdatableManager {
    updatables: Vec<Box<dyn IUpdatable>>,
    needs_sort: bool,
}

impl UpdatableManager {
    /**
     * 创建新的可更新对象管理器
     */
    pub fn new() -> Self {
        Self {
            updatables: Vec::new(),
            needs_sort: false,
        }
    }

    /**
     * 添加可更新对象
     */
    pub fn add_updatable(&mut self, updatable: Box<dyn IUpdatable>) {
        self.updatables.push(updatable);
        self.needs_sort = true;
    }

    /**
     * 移除可更新对象（通过索引）
     */
    pub fn remove_updatable(&mut self, index: usize) -> Option<Box<dyn IUpdatable>> {
        if index < self.updatables.len() {
            Some(self.updatables.remove(index))
        } else {
            None
        }
    }

    /**
     * 获取可更新对象数量
     */
    pub fn get_count(&self) -> usize {
        self.updatables.len()
    }

    /**
     * 清空所有可更新对象
     */
    pub fn clear(&mut self) {
        self.updatables.clear();
        self.needs_sort = false;
    }

    /**
     * 根据更新顺序排序可更新对象
     */
    pub fn sort_by_update_order(&mut self) {
        if self.needs_sort {
            self.updatables.sort_by(|a, b| IUpdatableComparer::compare(a.as_ref(), b.as_ref()));
            self.needs_sort = false;
        }
    }

    /**
     * 更新所有启用的可更新对象
     */
    pub fn update_all(&mut self) {
        // 确保按更新顺序排序
        self.sort_by_update_order();
        
        // 更新所有启用的对象
        for updatable in &mut self.updatables {
            if updatable.is_enabled() {
                updatable.update();
            }
        }
    }

    /**
     * 获取启用的可更新对象数量
     */
    pub fn get_enabled_count(&self) -> usize {
        self.updatables.iter().filter(|u| u.is_enabled()).count()
    }

    /**
     * 检查是否需要排序
     */
    pub fn needs_sorting(&self) -> bool {
        self.needs_sort
    }

    /**
     * 强制标记需要排序
     */
    pub fn mark_needs_sort(&mut self) {
        self.needs_sort = true;
    }

    /**
     * 获取指定索引的可更新对象引用
     */
    pub fn get_updatable(&self, index: usize) -> Option<&dyn IUpdatable> {
        self.updatables.get(index).map(|u| u.as_ref())
    }

    /**
     * 获取指定索引的可更新对象可变引用
     */
    pub fn get_updatable_mut(&mut self, index: usize) -> Option<&mut Box<dyn IUpdatable>> {
        self.updatables.get_mut(index)
    }
}

impl Default for UpdatableManager {
    fn default() -> Self {
        Self::new()
    }
}

/**
 * 场景组件管理器
 * 专门用于管理场景组件
 */
pub struct SceneComponentManager {
    components: Vec<Box<dyn SceneComponentTrait>>,
    needs_sort: bool,
}

/**
 * 场景组件trait
 * 结合SceneComponent和IUpdatable的功能
 */
pub trait SceneComponentTrait: IUpdatable {
    /**
     * 获取场景组件的基础数据
     */
    fn get_base(&self) -> &SceneComponent;
    
    /**
     * 获取场景组件的可变基础数据
     */
    fn get_base_mut(&mut self) -> &mut SceneComponent;
    
    /**
     * 设置所属场景ID
     */
    fn set_scene_id(&mut self, scene_id: Option<u32>);
    
    /**
     * 当组件启用时调用
     */
    fn on_enabled(&mut self);
    
    /**
     * 当组件禁用时调用
     */
    fn on_disabled(&mut self);
    
    /**
     * 当组件从场景中移除时调用
     */
    fn on_removed_from_scene(&mut self);
}

impl SceneComponentManager {
    /**
     * 创建新的场景组件管理器
     */
    pub fn new() -> Self {
        Self {
            components: Vec::new(),
            needs_sort: false,
        }
    }

    /**
     * 添加场景组件
     */
    pub fn add_component(&mut self, component: Box<dyn SceneComponentTrait>) {
        self.components.push(component);
        self.needs_sort = true;
    }

    /**
     * 移除场景组件
     */
    pub fn remove_component(&mut self, index: usize) -> Option<Box<dyn SceneComponentTrait>> {
        if index < self.components.len() {
            let mut component = self.components.remove(index);
            component.on_removed_from_scene();
            Some(component)
        } else {
            None
        }
    }

    /**
     * 获取组件数量
     */
    pub fn get_count(&self) -> usize {
        self.components.len()
    }

    /**
     * 清空所有组件
     */
    pub fn clear(&mut self) {
        for mut component in self.components.drain(..) {
            component.on_removed_from_scene();
        }
        self.needs_sort = false;
    }

    /**
     * 根据更新顺序排序组件
     */
    pub fn sort_by_update_order(&mut self) {
        if self.needs_sort {
            self.components.sort_by(|a, b| a.get_update_order().cmp(&b.get_update_order()));
            self.needs_sort = false;
        }
    }

    /**
     * 更新所有启用的组件
     */
    pub fn update_all(&mut self) {
        // 确保按更新顺序排序
        self.sort_by_update_order();
        
        // 更新所有启用的组件
        for component in &mut self.components {
            if component.is_enabled() {
                component.update();
            }
        }
    }

    /**
     * 设置所有组件的场景ID
     */
    pub fn set_scene_id_for_all(&mut self, scene_id: Option<u32>) {
        for component in &mut self.components {
            component.set_scene_id(scene_id);
        }
    }

    /**
     * 获取启用的组件数量
     */
    pub fn get_enabled_count(&self) -> usize {
        self.components.iter().filter(|c| c.is_enabled()).count()
    }

    /**
     * 获取指定索引的组件引用
     */
    pub fn get_component(&self, index: usize) -> Option<&dyn SceneComponentTrait> {
        self.components.get(index).map(|c| c.as_ref())
    }

    /**
     * 获取指定索引的组件可变引用
     */
    pub fn get_component_mut(&mut self, index: usize) -> Option<&mut Box<dyn SceneComponentTrait>> {
        self.components.get_mut(index)
    }
}

impl Default for SceneComponentManager {
    fn default() -> Self {
        Self::new()
    }
}

// 为SceneComponent实现SceneComponentTrait
impl SceneComponentTrait for SceneComponent {
    fn get_base(&self) -> &SceneComponent {
        self
    }

    fn get_base_mut(&mut self) -> &mut SceneComponent {
        self
    }

    fn set_scene_id(&mut self, scene_id: Option<u32>) {
        SceneComponent::set_scene_id(self, scene_id);
    }

    fn on_enabled(&mut self) {
        SceneComponent::on_enabled(self);
    }

    fn on_disabled(&mut self) {
        SceneComponent::on_disabled(self);
    }

    fn on_removed_from_scene(&mut self) {
        SceneComponent::on_removed_from_scene(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // 测试用的可更新对象
    struct TestUpdatable {
        enabled: bool,
        update_order: i32,
        update_count: usize,
    }

    impl TestUpdatable {
        fn new(update_order: i32) -> Self {
            Self {
                enabled: true,
                update_order,
                update_count: 0,
            }
        }
    }

    impl IUpdatable for TestUpdatable {
        fn is_enabled(&self) -> bool {
            self.enabled
        }

        fn get_update_order(&self) -> i32 {
            self.update_order
        }

        fn update(&mut self) {
            self.update_count += 1;
        }

        fn as_any(&self) -> &dyn Any {
            self
        }

        fn as_any_mut(&mut self) -> &mut dyn Any {
            self
        }
    }

    #[test]
    fn test_scene_component_creation() {
        let component = SceneComponent::new();
        assert!(component.enabled());
        assert_eq!(component.get_update_order(), 0);
        assert!(component.scene_id.is_none());
    }

    #[test]
    fn test_scene_component_with_update_order() {
        let component = SceneComponent::with_update_order(5);
        assert!(component.enabled());
        assert_eq!(component.get_update_order(), 5);
    }

    #[test]
    fn test_scene_component_enable_disable() {
        let mut component = SceneComponent::new();
        
        assert!(component.enabled());
        
        component.set_enabled(false);
        assert!(!component.enabled());
        
        component.set_enabled(true);
        assert!(component.enabled());
    }

    #[test]
    fn test_scene_component_update_order() {
        let mut component = SceneComponent::new();
        
        assert_eq!(component.get_update_order(), 0);
        
        component.set_update_order(10);
        assert_eq!(component.get_update_order(), 10);
    }

    #[test]
    fn test_scene_component_comparison() {
        let component1 = SceneComponent::with_update_order(5);
        let component2 = SceneComponent::with_update_order(10);
        let component3 = SceneComponent::with_update_order(5);
        
        assert_eq!(component1.compare(&component2), std::cmp::Ordering::Less);
        assert_eq!(component2.compare(&component1), std::cmp::Ordering::Greater);
        assert_eq!(component1.compare(&component3), std::cmp::Ordering::Equal);
    }

    #[test]
    fn test_updatable_comparer() {
        let updatable1 = TestUpdatable::new(5);
        let updatable2 = TestUpdatable::new(10);
        let updatable3 = TestUpdatable::new(5);
        
        assert_eq!(IUpdatableComparer::compare(&updatable1, &updatable2), std::cmp::Ordering::Less);
        assert_eq!(IUpdatableComparer::compare(&updatable2, &updatable1), std::cmp::Ordering::Greater);
        assert_eq!(IUpdatableComparer::compare(&updatable1, &updatable3), std::cmp::Ordering::Equal);
    }

    #[test]
    fn test_updatable_manager_creation() {
        let manager = UpdatableManager::new();
        assert_eq!(manager.get_count(), 0);
        assert_eq!(manager.get_enabled_count(), 0);
        assert!(!manager.needs_sorting());
    }

    #[test]
    fn test_updatable_manager_add_remove() {
        let mut manager = UpdatableManager::new();
        
        let updatable = TestUpdatable::new(5);
        manager.add_updatable(Box::new(updatable));
        
        assert_eq!(manager.get_count(), 1);
        assert_eq!(manager.get_enabled_count(), 1);
        assert!(manager.needs_sorting());
        
        let removed = manager.remove_updatable(0);
        assert!(removed.is_some());
        assert_eq!(manager.get_count(), 0);
    }

    #[test]
    fn test_updatable_manager_update_all() {
        let mut manager = UpdatableManager::new();
        
        let updatable1 = TestUpdatable::new(10);
        let mut updatable2 = TestUpdatable::new(5);
        let updatable3 = TestUpdatable::new(15);
        
        // 禁用第二个对象
        updatable2.enabled = false;
        
        manager.add_updatable(Box::new(updatable1));
        manager.add_updatable(Box::new(updatable2));
        manager.add_updatable(Box::new(updatable3));
        
        assert_eq!(manager.get_count(), 3);
        assert_eq!(manager.get_enabled_count(), 2); // 只有2个启用
        
        // 更新所有对象
        manager.update_all();
        
        // 检查更新次数（通过类型转换）
        if let Some(updatable) = manager.get_updatable(0) {
            if let Some(test_updatable) = updatable.as_any().downcast_ref::<TestUpdatable>() {
                // 由于排序，update_order=5的应该是第一个
                assert_eq!(test_updatable.update_order, 5);
            }
        }
    }

    #[test]
    fn test_updatable_manager_sorting() {
        let mut manager = UpdatableManager::new();
        
        manager.add_updatable(Box::new(TestUpdatable::new(10)));
        manager.add_updatable(Box::new(TestUpdatable::new(5)));
        manager.add_updatable(Box::new(TestUpdatable::new(15)));
        
        assert!(manager.needs_sorting());
        
        manager.sort_by_update_order();
        
        assert!(!manager.needs_sorting());
        
        // 检查排序结果
        assert_eq!(manager.get_updatable(0).unwrap().get_update_order(), 5);
        assert_eq!(manager.get_updatable(1).unwrap().get_update_order(), 10);
        assert_eq!(manager.get_updatable(2).unwrap().get_update_order(), 15);
    }

    #[test]
    fn test_updatable_manager_clear() {
        let mut manager = UpdatableManager::new();
        
        manager.add_updatable(Box::new(TestUpdatable::new(5)));
        manager.add_updatable(Box::new(TestUpdatable::new(10)));
        
        assert_eq!(manager.get_count(), 2);
        
        manager.clear();
        
        assert_eq!(manager.get_count(), 0);
        assert_eq!(manager.get_enabled_count(), 0);
        assert!(!manager.needs_sorting());
    }

    #[test]
    fn test_scene_component_manager_creation() {
        let manager = SceneComponentManager::new();
        assert_eq!(manager.get_count(), 0);
        assert_eq!(manager.get_enabled_count(), 0);
    }

    #[test]
    fn test_scene_component_manager_add_remove() {
        let mut manager = SceneComponentManager::new();
        
        let component = SceneComponent::new();
        manager.add_component(Box::new(component));
        
        assert_eq!(manager.get_count(), 1);
        assert_eq!(manager.get_enabled_count(), 1);
        
        let removed = manager.remove_component(0);
        assert!(removed.is_some());
        assert_eq!(manager.get_count(), 0);
    }

    #[test]
    fn test_scene_component_manager_update_all() {
        let mut manager = SceneComponentManager::new();
        
        let component1 = SceneComponent::with_update_order(10);
        let mut component2 = SceneComponent::with_update_order(5);
        let component3 = SceneComponent::with_update_order(15);
        
        // 禁用第二个组件
        component2.set_enabled(false);
        
        manager.add_component(Box::new(component1));
        manager.add_component(Box::new(component2));
        manager.add_component(Box::new(component3));
        
        assert_eq!(manager.get_count(), 3);
        assert_eq!(manager.get_enabled_count(), 2); // 只有2个启用
        
        // 更新所有组件
        manager.update_all();
        
        // 检查排序结果
        assert_eq!(manager.get_component(0).unwrap().get_update_order(), 5);
        assert_eq!(manager.get_component(1).unwrap().get_update_order(), 10);
        assert_eq!(manager.get_component(2).unwrap().get_update_order(), 15);
    }

    #[test]
    fn test_scene_component_manager_clear() {
        let mut manager = SceneComponentManager::new();
        
        manager.add_component(Box::new(SceneComponent::new()));
        manager.add_component(Box::new(SceneComponent::new()));
        
        assert_eq!(manager.get_count(), 2);
        
        manager.clear();
        
        assert_eq!(manager.get_count(), 0);
        assert_eq!(manager.get_enabled_count(), 0);
    }

    #[test]
    fn test_scene_component_as_updatable() {
        let mut component = SceneComponent::with_update_order(5);
        
        assert!(component.enabled());
        assert_eq!(component.get_update_order(), 5);
        
        component.update();
        
        component.set_enabled(false);
        assert!(!component.enabled());
    }

    #[test]
    fn test_scene_component_trait_implementation() {
        let mut component = SceneComponent::with_update_order(10);
        
        // 测试SceneComponentTrait方法
        assert_eq!(component.get_base().get_update_order(), 10);
        
        component.get_base_mut().set_update_order(20);
        assert_eq!(component.get_update_order(), 20);
        
        component.set_scene_id(None);
        assert!(component.get_base().scene_id.is_none());
    }
}