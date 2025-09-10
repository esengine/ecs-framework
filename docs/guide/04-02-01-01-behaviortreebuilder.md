# BehaviorTreeBuilder

BehaviorTreeBuilder 类为在 @esengine/ai 库中创建行为树提供了主要的构建接口。它支持两种主要方法：用于程序化构建的流式 API 方法链，以及用于数据驱动树创建的 JSON 配置加载。此构建器处理节点实例化、父子关系、黑板集成以及所有支持的节点类型的验证。

有关已构建树的运行时执行，请参见[运行时执行](04-02-01-05-runtime-execution.md)。有关黑板系统集成，请参见[黑板系统](04-02-01-06-blackboard-system.md)。