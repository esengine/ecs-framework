# Coroutine
## 协程介绍
框架的协程系统是基于js的一个简单而强大的迭代器。这一点你不必关注太多，我们直接进入一个简单的例子来看看协程到底能干什么。首先，我们来看一下这段简单的代码

### 倒计时器
这是一个简单的脚本组件，只做了倒计时，并且在到达0的时候log一个信息。
```typescript
export class AComponent extends es.Component implements es.IUpdatable {
    public timer = 3;
    update() {
        this.timer -= es.Time.deltaTime;
        if(this.timer <= 0) {
            console.Log("Timer has finished!");
        }
    }
}
```

还不错，代码简短实用，但问题是，如果我们需要复杂的脚本组件（像一个角色或者敌人的类），拥有多个计时器呢？刚开始的时候，我们的代码也许会是这样的：

```typescript
export class AComponent extends es.Component implements es.IUpdatable
{
    public firstTimer = 3;
    public secondTimer = 2;
    public thirdTimer = 1;
    update() {
        this.firstTimer -= es.Time.deltaTime;
        if(this.firstTimer <= 0)
            console.Log("First timer has finished!");
        this.secondTimer -= es.Time.deltaTime;
        if(this.secondTimer <= 0)
            console.Log("Second timer has finished!");
        this.thirdTimer -= es.Time.deltaTime;
        if(this.thirdTimer <= 0)
            console.Log("Third timer has finished!");
    }
}

```

尽管不是太糟糕，但是我个人不是很喜欢自己的代码中充斥着这些计时器变量，它们看上去很乱，而且当我需要重新开始计时的时候还得记得去重置它们（这活我经常忘记做）。

 

如果我只用一个for循环来做这些，看上去是否会好很多？

```typescript
for(let timer = 3; timer >= 0; timer -= es.Time.deltaTime) {
    //Just do nothing...
}
console.Log("This happens after 5 seconds!");
```

现在每一个计时器变量都成为for循环的一部分了，这看上去好多了，而且我不需要去单独设置每一个跌倒变量。

 

好的，你可能现在明白我的意思：协程可以做的正是这一点！

## 码入你的协程！

现在，这里提供了上面例子运用协程的版本！我建议你从这里开始跟着我来写一个简单的脚本组件，这样你可以在你自己的程序中看到它是如何工作的。

```typescript
export class AComponent extends es.Component implements es.IUpdatable
{
    onAddedToEntity() {
        es.Core.startCoroutine(this.countdown());
    }

    *countdown() {
        for(let timer = 3; timer >= 0; timer -= es.Time.deltaTime)
            yield null;
        console.Log("This message appears after 3 seconds!");
    }
}

```

这看上去有点不一样，没关系，接下来我会解释这里到底发生了什么。

```typescript
es.Core.startCoroutine(this.countdown());
```

这一行用来开始我们的countdown程序，注意，我并没有给它传入参数，但是这个方法调用了它自己（这是通过传递countdown的yield返回值来实现的）。

### Yield

为了能在连续的多帧中（在这个例子中，3秒钟等同于很多帧）调用该方法，框架必须通过某种方式来存储这个方法的状态，这是通过迭代器中使用yield语句得到的返回值，当你`yield`一个方法时，你相当于说了，**现在停止这个方法，然后在下一帧中从这里重新开始！**。

> 注意：用0或者null来yield的意思是告诉协程等待下一帧，直到继续执行为止。当然，同样的你可以继续yield其他协程，我会在下一个教程中讲到这些。

## 一些例子

协程在刚开始接触的时候是非常难以理解的，无论是新手还是经验丰富的程序员我都见过他们对于协程语句一筹莫展的时候。因此我认为通过例子来理解它是最好的方法，这里有一些简单的协程例子：

### 多次输出Hello

记住，yield是 **停止执行方法，并且在下一帧从这里重新开始**，这意味着你可以这样做：

```typescript
//这将打招呼 5 次，每帧一次，持续 5 帧
*sayHelloFiveTimes() {
    yield null;
    console.Log("Hello");
    yield null;
    console.Log("Hello");
    yield null;
    console.Log("Hello");
    yield null;
    console.Log("Hello");
    yield null;
    console.Log("Hello");
}
//这将做与上述功能完全相同的事情！
*sayHello5Times() {
    for(let i = 0; i < 5; i++) {
        console.Log("Hello");
        yield null;
    }
}
```

### 每一帧输出“Hello”，无限循环。。。

通过在一个while循环中使用yield，你可以得到一个无限循环的协程，这几乎就跟一个update()循环等同

```typescript
//一旦启动，这将一直运行直到手动停止
*sayHelloEveryFrame(){
    while(true) {
        console.Log("Hello");
        yield null;
    }
}
```

### 计时
不过跟update()不一样的是，你可以在协程中做一些更有趣的事

```typescript
*countSeconds(){
    let seconds = 0;
    while(true)
    {
        // 1秒后执行下一帧
        yield 1;
        seconds++;
        console.Log("自协程启动以来已经过去了" + seconds + "秒钟.");
    }
}
```

这个方法突出了协程一个非常酷的地方：方法的状态被存储了，这使得方法中定义的这些变量都会保存它们的值，即使是在不同的帧中。还记得这个教程开始时那些烦人的计时器变量吗？通过协程，我们再也不需要担心它们了，只需要把变量直接放到方法里面！

### 开始和终止协程

之前，我们已经学过了通过 es.Core.startCoroutine()方法来开始一个协程，就像这样：

```typescript
const coroutine = es.Core.startCoroutine(this.countdown());
```

我们可以像这样停止协程

```typescript
coroutine.stop();
```

或者你可以再迭代器内返回`yield "break"`方式中止协程

```typescript
*countSeconds(){
    let seconds = 0;
    while(true)
    {
        for(let timer = 0; timer < 1; timer += es.Time.deltaTime)
            yield null;
        seconds++;
        console.Log("自协程启动以来已经过去了" + seconds + "秒钟.");

        // 如果大于10秒，终止协程
        if (second > 10)
            yield "break";
    }
}
```