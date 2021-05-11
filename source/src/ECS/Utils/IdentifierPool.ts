module es {
    export class IdentifierPool {
        private ids: Bag<number>;
        private nextAvailableId_ = 0;

        constructor() {
            this.ids = new Bag<number>();
        }

        public checkOut(): number {
            if (this.ids.size() > 0) {
                return this.ids.removeLast();
            }

            return this.nextAvailableId_++;
        }

        public checkIn(id: number): void {
            this.ids.add(id);
        }
    }
}