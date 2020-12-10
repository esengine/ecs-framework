module es {
    export class TypeUtils {
        public static getType(obj: any){
            return obj["__proto__"]["constructor"];
        }
    }
}