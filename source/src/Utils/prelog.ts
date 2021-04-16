module es {
    export interface Class extends Function {}

    export function getClassName(klass): string {
        return klass.className || klass.name;
    }
}