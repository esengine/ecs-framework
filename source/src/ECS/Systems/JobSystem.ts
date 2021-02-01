module es {
    /**
     * JobSystem使用实体的子集调用Execute（entities），并在指定数量的线程上分配工作负载。
     */
    export abstract class JobSystem extends EntitySystem {
        public readonly _threads: number;
        public readonly _jobs: Job[];
        public readonly _executeStr: string;

        constructor(matcher: Matcher, threads: number) {
            super(matcher);

            this._threads = threads;
            this._jobs = new Array(threads);
            for (let i = 0; i < this._jobs.length; i++) {
                this._jobs[i] = new Job();
            }
            this._executeStr = JSON.stringify(this.execute, function (key, val) {
                if (typeof val === 'function') {
                    return val + '';
                }
                return val;
            });
        }

        protected process(entities: Entity[]) {
            let remainder = entities.length & this._threads;
            let slice = entities.length / this._threads + (remainder == 0 ? 0 : 1);
            for (let t = 0; t < this._threads; t++) {
                let from = t * slice;
                let to = from + slice;
                if (to > entities.length) {
                    to = entities.length;
                }

                let job = this._jobs[t];
                job.set(entities, from, to, this._executeStr, this);
                if (from != to) {
                    const worker = WorkerUtils.makeWorker(this.queueOnThread);
                    const workerDo = WorkerUtils.workerMessage(worker);
                    workerDo(job).then((message) => {
                        let job = message as Job;
                        this.resetJob(job);
                        worker.terminate();
                    }).catch((err) => {
                        job.err = err;
                        worker.terminate();
                    });
                }
            }
        }

        private queueOnThread() {
            onmessage = ({ data: { jobId, message } }) => {
                let job = message[0] as Job;
                let executeFunc: Function = JSON.parse(job.execute, function (k, v) {
                    if (v.indexOf && v.indexOf('function') > -1) {
                        return eval("(function(){return " + v + " })()")
                    }

                    return v;
                });
                for (let i = job.from; i < job.to; i++) {
                    executeFunc.call(job.context, job.entities[i]);
                }

                postMessage({ jobId, result: message }, null);
            };
        }

        /**
         * 当操作完成时，改变的值需要用户进行手动传递
         * 由于worker数据无法共享，所以这块需要特殊处理
         * @example this.test = job[0].context.test;
         * @param job 
         */
        protected abstract resetJob(job: Job);
        /**
         * 对指定实体进行多线程操作
         * @param entity 
         */
        protected abstract execute(entity: Entity);
    }

    class Job {
        public entities: Entity[];
        public from: number;
        public to: number;
        public worker: Worker;
        public execute: string;
        public err: string;
        public context;

        public set(entities: Entity[], from: number, to: number, execute: string, context: any) {
            this.entities = entities;
            this.from = from;
            this.to = to;
            this.execute = execute;
            this.context = context;
        }
    }
}