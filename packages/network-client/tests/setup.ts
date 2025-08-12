import 'reflect-metadata';

// Mock WebSocket for testing
(global as any).WebSocket = class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  
  constructor(public url: string) {}
  
  send(data: string | ArrayBuffer | Blob) {
    // Mock implementation
  }
  
  close() {
    // Mock implementation
  }
};

global.beforeEach(() => {
    jest.clearAllMocks();
});

global.afterEach(() => {
    jest.restoreAllMocks();
});