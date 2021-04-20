module es {
    /**
     * 当添加到组件时，每当实体上的冲突器与另一个组件重叠/退出时，将调用这些方法。
     * ITriggerListener方法将在实现接口的触发器实体上的任何组件上调用。
     * 注意，这个接口只与Mover类一起工作
     */
    export interface ITriggerListener {
        /**
         * 当碰撞器与触发碰撞器相交时调用。这是在触发碰撞器和触发碰撞器上调用的。
         * 移动必须由Mover/ProjectileMover方法处理，以使其自动工作。
         * @param other
         * @param local
         */
        onTriggerEnter(other: Collider, local: Collider);

        /**
         * 当另一个碰撞器离开触发碰撞器时调用
         * @param other
         * @param local
         */
        onTriggerExit(other: Collider, local: Collider);
    }

    export class TriggerListenerHelper {
        public static getITriggerListener(entity: Entity, components: ITriggerListener[]){
            for (let component of entity.components._components) {
                if (isITriggerListener(component)) {
                    components.push(component);
                }
            }

            for (let i in entity.components._componentsToAdd) {
                let component = entity.components._componentsToAdd[i];
                if (isITriggerListener(component)) {
                    components.push(component);
                }
            }

            return components;
        }
    }

    export var isITriggerListener = (props: any): props is ITriggerListener => typeof (props as ITriggerListener)['onTriggerEnter'] !== 'undefined';
}
