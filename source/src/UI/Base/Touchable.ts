module es {
    export enum Touchable {
        /**
         * 所有触摸输入事件都将由元素和任何子元素接收
         */
        enabled,
        /**
         * 元素或任何子元素都不会收到触摸输入事件
         */
        disabled,
        /**
         * 元素不会接收触摸输入事件，但子元素仍会接收事件。 请注意，子级上的事件仍会冒泡到父级
         */
        childrenOnly,
    }
}