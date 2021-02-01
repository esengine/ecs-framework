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
         */
        public static makeWorker(doFunc: Function) {
            const worker = new Worker(URL.createObjectURL(new Blob([`(${doFunc.toString()})()`])));

            return worker;
        }

        public static workerMessage(worker: Worker) {
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