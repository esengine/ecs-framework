module es {
    export class NumberExtension {
        public static toNumber(value){
            if (value == undefined) return 0;

            return Number(value);
        }
    }
}