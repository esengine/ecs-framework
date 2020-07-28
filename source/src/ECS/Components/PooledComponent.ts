module es {
    /** 回收实例的组件类型。 */
    export abstract class PooledComponent extends Component {
        public abstract reset();
    }
}
