// React JSX Runtime shim - 从全局变量导出
const ReactJSXRuntime = window.ReactJSXRuntime;
export const { jsx, jsxs, Fragment } = ReactJSXRuntime;
export default ReactJSXRuntime;
