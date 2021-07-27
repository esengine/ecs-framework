# Emitter
Core提供了一个在某些关键时刻触发事件的发射器。 通过Core.emitter.addObserver和Core.emitter.removeObserver进行访问。 CoreEvents枚举定义了所有可用事件。

发射器类也可以在自己的类中使用。 您可以通过number，enum或任何结构键输入事件。  

## 自定义事件发生器

- string为key的事件发生器
```typescript
export enum CustomEvent {
    enum1,
    enum2
}

export class MainScene extends es.Scene {
    // string为key的事件发生器
    private str_emitter = new es.Emitter<string>();
    // number为key的事件发生器
    private num_emitter = new es.Emitter<number>();
    // enum为key的事件发生器
    private custom_emitter = new es.Emitter<CustomEvent>();

    onStart() {
        // 监听触发器
        this.str_emitter.addObserver("test", this.onStrEmit, this);

        // 触发监听器
        this.str_emitter.emit("test");

        // 移除事件触发器
        this.str_emitter.removeObserver("test", this.onStrEmit);
    }

    // args为emit传入的参数。不传则为空
    onStrEmit(...args: any[]) {
        console.log("test");
    }
}
```