module es {
    export interface IEqualityComparer {
        equals(x: any, y: any): boolean;
    }
}