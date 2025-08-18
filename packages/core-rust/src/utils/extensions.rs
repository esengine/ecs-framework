use std::any::{Any, TypeId};
use std::fmt::Debug;

/**
 * 数字扩展工具
 * 提供数字转换和处理的实用方法
 */
pub struct NumberExtension;

impl NumberExtension {
    /**
     * 将Option<T>转换为数字，如果值为None则返回0
     */
    pub fn to_number_from_option<T>(value: Option<T>) -> f64 
    where
        T: Into<f64>,
    {
        value.map(|v| v.into()).unwrap_or(0.0)
    }

    /**
     * 将字符串转换为数字，如果解析失败则返回默认值
     */
    pub fn parse_or_default(value: &str, default: f64) -> f64 {
        value.parse::<f64>().unwrap_or(default)
    }

    /**
     * 将字符串转换为数字，如果解析失败则返回0
     */
    pub fn parse_or_zero(value: &str) -> f64 {
        Self::parse_or_default(value, 0.0)
    }

    /**
     * 将字符串转换为整数，如果解析失败则返回默认值
     */
    pub fn parse_int_or_default(value: &str, default: i64) -> i64 {
        value.parse::<i64>().unwrap_or(default)
    }

    /**
     * 将字符串转换为整数，如果解析失败则返回0
     */
    pub fn parse_int_or_zero(value: &str) -> i64 {
        Self::parse_int_or_default(value, 0)
    }

    /**
     * 将布尔值转换为数字
     */
    pub fn bool_to_number(value: bool) -> f64 {
        if value { 1.0 } else { 0.0 }
    }

    /**
     * 将数字转换为布尔值
     */
    pub fn number_to_bool(value: f64) -> bool {
        value != 0.0
    }

    /**
     * 限制数字在指定范围内
     */
    pub fn clamp(value: f64, min: f64, max: f64) -> f64 {
        if value < min {
            min
        } else if value > max {
            max
        } else {
            value
        }
    }

    /**
     * 检查数字是否在指定范围内
     */
    pub fn is_in_range(value: f64, min: f64, max: f64) -> bool {
        value >= min && value <= max
    }

    /**
     * 四舍五入到指定小数位数
     */
    pub fn round_to_decimal_places(value: f64, decimal_places: u32) -> f64 {
        let multiplier = 10_f64.powi(decimal_places as i32);
        (value * multiplier).round() / multiplier
    }

    /**
     * 将弧度转换为角度
     */
    pub fn radians_to_degrees(radians: f64) -> f64 {
        radians * 180.0 / std::f64::consts::PI
    }

    /**
     * 将角度转换为弧度
     */
    pub fn degrees_to_radians(degrees: f64) -> f64 {
        degrees * std::f64::consts::PI / 180.0
    }

    /**
     * 线性插值
     */
    pub fn lerp(from: f64, to: f64, t: f64) -> f64 {
        from + (to - from) * t
    }

    /**
     * 反向线性插值，返回t值
     */
    pub fn inverse_lerp(from: f64, to: f64, value: f64) -> f64 {
        if (to - from).abs() < f64::EPSILON {
            0.0
        } else {
            (value - from) / (to - from)
        }
    }

    /**
     * 计算两个数字之间的距离
     */
    pub fn distance(a: f64, b: f64) -> f64 {
        (a - b).abs()
    }

    /**
     * 检查两个浮点数是否近似相等
     */
    pub fn approximately_equal(a: f64, b: f64, epsilon: Option<f64>) -> bool {
        let eps = epsilon.unwrap_or(f64::EPSILON);
        (a - b).abs() < eps
    }

    /**
     * 将值包装在0到max之间（循环）
     */
    pub fn wrap(value: f64, max: f64) -> f64 {
        if max <= 0.0 {
            return 0.0;
        }
        
        let mut result = value % max;
        if result < 0.0 {
            result += max;
        }
        result
    }

    /**
     * 计算数字的符号（-1, 0, 1）
     */
    pub fn sign(value: f64) -> f64 {
        if value > 0.0 {
            1.0
        } else if value < 0.0 {
            -1.0
        } else {
            0.0
        }
    }
}

/**
 * 类型工具
 * 提供类型相关的实用方法
 */
pub struct TypeUtils;

impl TypeUtils {
    /**
     * 获取类型的TypeId
     */
    pub fn get_type_id<T: 'static>() -> TypeId {
        TypeId::of::<T>()
    }

    /**
     * 获取对象的TypeId
     */
    pub fn get_object_type_id<T: 'static>(_obj: &T) -> TypeId {
        TypeId::of::<T>()
    }

    /**
     * 获取类型名称
     */
    pub fn get_type_name<T: 'static>() -> &'static str {
        std::any::type_name::<T>()
    }

    /**
     * 获取对象的类型名称
     */
    pub fn get_object_type_name<T: 'static>(_obj: &T) -> &'static str {
        std::any::type_name::<T>()
    }

    /**
     * 检查两个类型是否相同
     */
    pub fn is_same_type<T: 'static, U: 'static>() -> bool {
        TypeId::of::<T>() == TypeId::of::<U>()
    }

    /**
     * 检查对象是否为指定类型
     */
    pub fn is_type<T: 'static, U: 'static>(_obj: &T) -> bool {
        TypeId::of::<T>() == TypeId::of::<U>()
    }

    /**
     * 尝试将Any trait对象转换为具体类型
     */
    pub fn downcast_ref<T: 'static>(obj: &dyn Any) -> Option<&T> {
        obj.downcast_ref::<T>()
    }

    /**
     * 尝试将可变Any trait对象转换为具体类型
     */
    pub fn downcast_mut<T: 'static>(obj: &mut dyn Any) -> Option<&mut T> {
        obj.downcast_mut::<T>()
    }

    /**
     * 检查是否可以转换为指定类型
     */
    pub fn can_downcast<T: 'static>(obj: &dyn Any) -> bool {
        obj.is::<T>()
    }

    /**
     * 获取类型的大小（字节）
     */
    pub fn get_type_size<T>() -> usize {
        std::mem::size_of::<T>()
    }

    /**
     * 获取对象的大小（字节）
     */
    pub fn get_object_size<T>(obj: &T) -> usize {
        std::mem::size_of_val(obj)
    }

    /**
     * 检查类型是否为零大小类型
     */
    pub fn is_zero_sized<T>() -> bool {
        std::mem::size_of::<T>() == 0
    }

    /**
     * 获取类型的对齐要求
     */
    pub fn get_type_align<T>() -> usize {
        std::mem::align_of::<T>()
    }

    /**
     * 检查类型是否实现了Copy trait（通过编译时检查）
     */
    pub fn is_copy_type<T: Copy>() -> bool {
        true
    }

    /**
     * 检查类型是否实现了Clone trait（通过编译时检查）
     */
    pub fn is_clone_type<T: Clone>() -> bool {
        true
    }

    /**
     * 检查类型是否实现了Debug trait（通过编译时检查）
     */
    pub fn is_debug_type<T: Debug>() -> bool {
        true
    }

    /**
     * 安全地克隆对象（如果实现了Clone）
     */
    pub fn safe_clone<T: Clone>(obj: &T) -> T {
        obj.clone()
    }

    /**
     * 获取类型的显示字符串（如果实现了Debug）
     */
    pub fn debug_string<T: Debug>(obj: &T) -> String {
        format!("{:?}", obj)
    }
}

/**
 * 字符串扩展工具
 * 提供字符串处理的实用方法
 */
pub struct StringExtension;

impl StringExtension {
    /**
     * 检查字符串是否为空或仅包含空白字符
     */
    pub fn is_null_or_whitespace(s: Option<&str>) -> bool {
        match s {
            None => true,
            Some(s) => s.trim().is_empty(),
        }
    }

    /**
     * 检查字符串是否为空
     */
    pub fn is_null_or_empty(s: Option<&str>) -> bool {
        match s {
            None => true,
            Some(s) => s.is_empty(),
        }
    }

    /**
     * 截断字符串到指定长度
     */
    pub fn truncate(s: &str, max_length: usize) -> String {
        if s.len() <= max_length {
            s.to_string()
        } else {
            let mut truncated = String::with_capacity(max_length + 3);
            truncated.push_str(&s[..max_length]);
            truncated.push_str("...");
            truncated
        }
    }

    /**
     * 将字符串转换为Pascal命名
     */
    pub fn to_pascal_case(s: &str) -> String {
        s.split_whitespace()
            .map(|word| {
                let mut chars = word.chars();
                match chars.next() {
                    None => String::new(),
                    Some(first) => first.to_uppercase().collect::<String>() + &chars.as_str().to_lowercase(),
                }
            })
            .collect::<Vec<String>>()
            .join("")
    }

    /**
     * 将字符串转换为camel命名
     */
    pub fn to_camel_case(s: &str) -> String {
        let pascal = Self::to_pascal_case(s);
        if pascal.is_empty() {
            return pascal;
        }
        
        let mut chars = pascal.chars();
        match chars.next() {
            None => String::new(),
            Some(first) => first.to_lowercase().collect::<String>() + chars.as_str(),
        }
    }

    /**
     * 将字符串转换为snake_case
     */
    pub fn to_snake_case(s: &str) -> String {
        s.chars()
            .enumerate()
            .flat_map(|(i, c)| {
                if i > 0 && c.is_uppercase() {
                    vec!['_', c.to_lowercase().next().unwrap()]
                } else {
                    vec![c.to_lowercase().next().unwrap()]
                }
            })
            .collect()
    }

    /**
     * 重复字符串指定次数
     */
    pub fn repeat(s: &str, count: usize) -> String {
        s.repeat(count)
    }

    /**
     * 左侧填充字符到指定长度
     */
    pub fn pad_left(s: &str, total_width: usize, pad_char: char) -> String {
        if s.len() >= total_width {
            s.to_string()
        } else {
            let pad_count = total_width - s.len();
            pad_char.to_string().repeat(pad_count) + s
        }
    }

    /**
     * 右侧填充字符到指定长度
     */
    pub fn pad_right(s: &str, total_width: usize, pad_char: char) -> String {
        if s.len() >= total_width {
            s.to_string()
        } else {
            let pad_count = total_width - s.len();
            s.to_string() + &pad_char.to_string().repeat(pad_count)
        }
    }

    /**
     * 反转字符串
     */
    pub fn reverse(s: &str) -> String {
        s.chars().rev().collect()
    }

    /**
     * 统计子字符串出现次数
     */
    pub fn count_occurrences(s: &str, pattern: &str) -> usize {
        if pattern.is_empty() {
            return 0;
        }
        
        let mut count = 0;
        let mut start = 0;
        
        while let Some(pos) = s[start..].find(pattern) {
            count += 1;
            start += pos + pattern.len();
        }
        
        count
    }

    /**
     * 移除字符串中的所有空白字符
     */
    pub fn remove_whitespace(s: &str) -> String {
        s.chars().filter(|c| !c.is_whitespace()).collect()
    }
}

/**
 * 集合扩展工具
 * 提供集合操作的实用方法
 */
pub struct CollectionExtension;

impl CollectionExtension {
    /**
     * 检查Vector是否为空或None
     */
    pub fn is_null_or_empty<T>(vec: Option<&Vec<T>>) -> bool {
        match vec {
            None => true,
            Some(v) => v.is_empty(),
        }
    }

    /**
     * 安全地获取Vector中指定索引的元素
     */
    pub fn get_safe<T>(vec: &[T], index: usize) -> Option<&T> {
        vec.get(index)
    }

    /**
     * 查找满足条件的第一个元素
     */
    pub fn find<T, F>(vec: &[T], predicate: F) -> Option<&T>
    where
        F: Fn(&T) -> bool,
    {
        vec.iter().find(|&item| predicate(item))
    }

    /**
     * 查找满足条件的所有元素
     */
    pub fn find_all<T, F>(vec: &[T], predicate: F) -> Vec<&T>
    where
        F: Fn(&T) -> bool,
    {
        vec.iter().filter(|&item| predicate(item)).collect()
    }

    /**
     * 检查是否存在满足条件的元素
     */
    pub fn exists<T, F>(vec: &[T], predicate: F) -> bool
    where
        F: Fn(&T) -> bool,
    {
        vec.iter().any(|item| predicate(item))
    }

    /**
     * 检查所有元素是否都满足条件
     */
    pub fn all<T, F>(vec: &[T], predicate: F) -> bool
    where
        F: Fn(&T) -> bool,
    {
        vec.iter().all(|item| predicate(item))
    }

    /**
     * 获取Vector的最大值
     */
    pub fn max<T: Ord + Clone>(vec: &[T]) -> Option<T> {
        vec.iter().max().cloned()
    }

    /**
     * 获取Vector的最小值
     */
    pub fn min<T: Ord + Clone>(vec: &[T]) -> Option<T> {
        vec.iter().min().cloned()
    }

    /**
     * 计算数字Vector的和
     */
    pub fn sum<T>(vec: &[T]) -> T
    where
        T: std::iter::Sum + Copy,
    {
        vec.iter().copied().sum()
    }

    /**
     * 计算数字Vector的平均值
     */
    pub fn average(vec: &[f64]) -> Option<f64> {
        if vec.is_empty() {
            None
        } else {
            Some(Self::sum(vec) / vec.len() as f64)
        }
    }

    /**
     * 去重Vector中的元素
     */
    pub fn distinct<T: Eq + Clone>(vec: &[T]) -> Vec<T> {
        let mut result = Vec::new();
        for item in vec {
            if !result.contains(item) {
                result.push(item.clone());
            }
        }
        result
    }

    /**
     * 分块处理Vector
     */
    pub fn chunk<T>(vec: &[T], size: usize) -> Vec<&[T]> {
        if size == 0 {
            return Vec::new();
        }
        vec.chunks(size).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_number_extension_parse() {
        assert_eq!(NumberExtension::parse_or_zero("123"), 123.0);
        assert_eq!(NumberExtension::parse_or_zero("123.45"), 123.45);
        assert_eq!(NumberExtension::parse_or_zero("invalid"), 0.0);
        assert_eq!(NumberExtension::parse_or_default("invalid", 99.0), 99.0);
        
        assert_eq!(NumberExtension::parse_int_or_zero("123"), 123);
        assert_eq!(NumberExtension::parse_int_or_zero("invalid"), 0);
        assert_eq!(NumberExtension::parse_int_or_default("invalid", 99), 99);
    }

    #[test]
    fn test_number_extension_bool_conversion() {
        assert_eq!(NumberExtension::bool_to_number(true), 1.0);
        assert_eq!(NumberExtension::bool_to_number(false), 0.0);
        
        assert_eq!(NumberExtension::number_to_bool(1.0), true);
        assert_eq!(NumberExtension::number_to_bool(0.0), false);
        assert_eq!(NumberExtension::number_to_bool(0.5), true);
        assert_eq!(NumberExtension::number_to_bool(-1.0), true);
    }

    #[test]
    fn test_number_extension_clamp() {
        assert_eq!(NumberExtension::clamp(5.0, 0.0, 10.0), 5.0);
        assert_eq!(NumberExtension::clamp(-1.0, 0.0, 10.0), 0.0);
        assert_eq!(NumberExtension::clamp(15.0, 0.0, 10.0), 10.0);
    }

    #[test]
    fn test_number_extension_range() {
        assert!(NumberExtension::is_in_range(5.0, 0.0, 10.0));
        assert!(!NumberExtension::is_in_range(-1.0, 0.0, 10.0));
        assert!(!NumberExtension::is_in_range(15.0, 0.0, 10.0));
    }

    #[test]
    fn test_number_extension_round() {
        assert_eq!(NumberExtension::round_to_decimal_places(3.14159, 2), 3.14);
        assert_eq!(NumberExtension::round_to_decimal_places(3.14159, 0), 3.0);
    }

    #[test]
    fn test_number_extension_angle_conversion() {
        let degrees = NumberExtension::radians_to_degrees(std::f64::consts::PI);
        assert!((degrees - 180.0).abs() < 0.001);
        
        let radians = NumberExtension::degrees_to_radians(180.0);
        assert!((radians - std::f64::consts::PI).abs() < 0.001);
    }

    #[test]
    fn test_number_extension_lerp() {
        assert_eq!(NumberExtension::lerp(0.0, 10.0, 0.5), 5.0);
        assert_eq!(NumberExtension::lerp(0.0, 10.0, 0.0), 0.0);
        assert_eq!(NumberExtension::lerp(0.0, 10.0, 1.0), 10.0);
        
        assert_eq!(NumberExtension::inverse_lerp(0.0, 10.0, 5.0), 0.5);
    }

    #[test]
    fn test_number_extension_distance() {
        assert_eq!(NumberExtension::distance(5.0, 3.0), 2.0);
        assert_eq!(NumberExtension::distance(3.0, 5.0), 2.0);
        assert_eq!(NumberExtension::distance(-2.0, 3.0), 5.0);
    }

    #[test]
    fn test_number_extension_approximately_equal() {
        assert!(NumberExtension::approximately_equal(1.0, 1.0000001, Some(0.001)));
        assert!(!NumberExtension::approximately_equal(1.0, 1.1, Some(0.001)));
    }

    #[test]
    fn test_number_extension_wrap() {
        assert_eq!(NumberExtension::wrap(5.0, 10.0), 5.0);
        assert_eq!(NumberExtension::wrap(15.0, 10.0), 5.0);
        assert_eq!(NumberExtension::wrap(-1.0, 10.0), 9.0);
    }

    #[test]
    fn test_number_extension_sign() {
        assert_eq!(NumberExtension::sign(5.0), 1.0);
        assert_eq!(NumberExtension::sign(-5.0), -1.0);
        assert_eq!(NumberExtension::sign(0.0), 0.0);
    }

    #[test]
    fn test_type_utils_type_id() {
        assert_eq!(TypeUtils::get_type_id::<i32>(), TypeUtils::get_type_id::<i32>());
        assert_ne!(TypeUtils::get_type_id::<i32>(), TypeUtils::get_type_id::<f64>());
        
        let value = 42i32;
        assert_eq!(TypeUtils::get_object_type_id(&value), TypeUtils::get_type_id::<i32>());
    }

    #[test]
    fn test_type_utils_type_name() {
        assert!(TypeUtils::get_type_name::<i32>().contains("i32"));
        
        let value = 42i32;
        assert!(TypeUtils::get_object_type_name(&value).contains("i32"));
    }

    #[test]
    fn test_type_utils_same_type() {
        assert!(TypeUtils::is_same_type::<i32, i32>());
        assert!(!TypeUtils::is_same_type::<i32, f64>());
    }

    #[test]
    fn test_type_utils_size() {
        assert_eq!(TypeUtils::get_type_size::<i32>(), 4);
        assert_eq!(TypeUtils::get_type_size::<i64>(), 8);
        
        let value = 42i32;
        assert_eq!(TypeUtils::get_object_size(&value), 4);
    }

    #[test]
    fn test_type_utils_zero_sized() {
        assert!(TypeUtils::is_zero_sized::<()>());
        assert!(!TypeUtils::is_zero_sized::<i32>());
    }

    #[test]
    fn test_string_extension_null_checks() {
        assert!(StringExtension::is_null_or_empty(None));
        assert!(StringExtension::is_null_or_empty(Some("")));
        assert!(!StringExtension::is_null_or_empty(Some("hello")));
        
        assert!(StringExtension::is_null_or_whitespace(None));
        assert!(StringExtension::is_null_or_whitespace(Some("   ")));
        assert!(!StringExtension::is_null_or_whitespace(Some("hello")));
    }

    #[test]
    fn test_string_extension_truncate() {
        assert_eq!(StringExtension::truncate("hello world", 5), "hello...");
        assert_eq!(StringExtension::truncate("hi", 10), "hi");
    }

    #[test]
    fn test_string_extension_case_conversion() {
        assert_eq!(StringExtension::to_pascal_case("hello world"), "HelloWorld");
        assert_eq!(StringExtension::to_camel_case("hello world"), "helloWorld");
        assert_eq!(StringExtension::to_snake_case("HelloWorld"), "hello_world");
    }

    #[test]
    fn test_string_extension_padding() {
        assert_eq!(StringExtension::pad_left("123", 5, '0'), "00123");
        assert_eq!(StringExtension::pad_right("123", 5, '0'), "12300");
    }

    #[test]
    fn test_string_extension_reverse() {
        assert_eq!(StringExtension::reverse("hello"), "olleh");
    }

    #[test]
    fn test_string_extension_count_occurrences() {
        assert_eq!(StringExtension::count_occurrences("hello world hello", "hello"), 2);
        assert_eq!(StringExtension::count_occurrences("test", "xyz"), 0);
    }

    #[test]
    fn test_collection_extension_null_checks() {
        assert!(CollectionExtension::is_null_or_empty(None::<&Vec<i32>>));
        assert!(CollectionExtension::is_null_or_empty(Some(&Vec::<i32>::new())));
        assert!(!CollectionExtension::is_null_or_empty(Some(&vec![1, 2, 3])));
    }

    #[test]
    fn test_collection_extension_safe_get() {
        let vec = vec![1, 2, 3];
        assert_eq!(CollectionExtension::get_safe(&vec, 0), Some(&1));
        assert_eq!(CollectionExtension::get_safe(&vec, 5), None);
    }

    #[test]
    fn test_collection_extension_find() {
        let vec = vec![1, 2, 3, 4, 5];
        assert_eq!(CollectionExtension::find(&vec, |&x| x > 3), Some(&4));
        assert_eq!(CollectionExtension::find(&vec, |&x| x > 10), None);
        
        let found_all = CollectionExtension::find_all(&vec, |&x| x > 3);
        assert_eq!(found_all, vec![&4, &5]);
    }

    #[test]
    fn test_collection_extension_predicates() {
        let vec = vec![1, 2, 3, 4, 5];
        assert!(CollectionExtension::exists(&vec, |&x| x > 3));
        assert!(!CollectionExtension::exists(&vec, |&x| x > 10));
        
        assert!(CollectionExtension::all(&vec, |&x| x > 0));
        assert!(!CollectionExtension::all(&vec, |&x| x > 3));
    }

    #[test]
    fn test_collection_extension_math() {
        let vec = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        assert_eq!(CollectionExtension::sum(&vec), 15.0);
        assert_eq!(CollectionExtension::average(&vec), Some(3.0));
        
        let int_vec = vec![1, 5, 3, 2, 4];
        assert_eq!(CollectionExtension::max(&int_vec), Some(5));
        assert_eq!(CollectionExtension::min(&int_vec), Some(1));
    }

    #[test]
    fn test_collection_extension_distinct() {
        let vec = vec![1, 2, 2, 3, 1, 4];
        let distinct = CollectionExtension::distinct(&vec);
        assert_eq!(distinct, vec![1, 2, 3, 4]);
    }

    #[test]
    fn test_collection_extension_chunk() {
        let vec = vec![1, 2, 3, 4, 5, 6, 7];
        let chunks = CollectionExtension::chunk(&vec, 3);
        assert_eq!(chunks.len(), 3);
        assert_eq!(chunks[0], &[1, 2, 3]);
        assert_eq!(chunks[1], &[4, 5, 6]);
        assert_eq!(chunks[2], &[7]);
    }

    #[test]
    fn test_number_extension_to_number_from_option() {
        assert_eq!(NumberExtension::to_number_from_option(Some(42)), 42.0);
        let result = NumberExtension::to_number_from_option(Some(3.14f32));
        assert!((result - 3.14).abs() < 0.0001); // 使用近似相等检查浮点数
        assert_eq!(NumberExtension::to_number_from_option::<i32>(None), 0.0);
    }
}