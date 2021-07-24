# Time
游戏中会经常使用到关于时间类。框架内提供了关于时间的多个属性

## 游戏运行的总时间
`es.Time.totalTime`

## deltaTime的未缩放版本。不受时间尺度的影响
`es.Time.unscaledDeltaTime`

## 前一帧到当前帧的时间增量(按时间刻度进行缩放)
`es.Time.deltaTime`

## 时间刻度缩放
`es.Time.timeScale`

## DeltaTime可以为的最大值
`es.Time.maxDeltaTime` 默认为Number.MAX_VALUE

## 已传递的帧总数
`es.Time.frameCount`

## 自场景加载以来的总时间
`es.Time.timeSinceSceneLoad`