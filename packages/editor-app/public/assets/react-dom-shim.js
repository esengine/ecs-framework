// React DOM shim - 从全局变量导出 ReactDOM
const ReactDOM = window.ReactDOM;
export default ReactDOM;
export const {
    createPortal,
    flushSync,
    hydrate,
    render,
    unmountComponentAtNode,
    unstable_batchedUpdates,
    unstable_renderSubtreeIntoContainer,
    version,
    createRoot,
    hydrateRoot
} = ReactDOM;
