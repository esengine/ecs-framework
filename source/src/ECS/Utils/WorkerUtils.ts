module es {
    /**
     * 开辟一个新线程
     * 注意：它无法获得主线程中的上下文
     */
    export class WorkerUtils {
        /** 正在执行的队列 */
        private static readonly pendingJobs = {};
        private static jobIdGen = 0;

        /**
         * 创建一个worker
         * @param doFunc worker所能做的事情
         * 
         * @example const worker = es.WorkerUtils.makeWorker(()=>{
         *      onmessage = ({data: {jobId, meesage}}) => {
         *          // worker内做的事
         *          console.log('我是线程', message, jobId);
         *      };
         * });
         * 
         * worker('主线程发送消息').then(message => {
         *      console.log('主线程收到消息', message);
         * });
         */
        public static makeWorker(doFunc: Function) {
            const worker = new Worker(URL.createObjectURL(new Blob([`(${doFunc.toString()})()`])));

            worker.onmessage = ({ data: { result, jobId } }) => {
                if (typeof this.pendingJobs[jobId] == 'function')
                    this.pendingJobs[jobId](result);

                delete this.pendingJobs[jobId];
            };

            return (...message: any[]) => {
                return new Promise(resolve => {
                    const jobId = this.jobIdGen++;
                    this.pendingJobs[jobId] = resolve;
                    worker.postMessage({ jobId, message });
                });
            }
        }
    }
}