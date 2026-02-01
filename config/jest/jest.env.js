// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb'; // Keep hardcoded for test isolation
process.env.NEXTAUTH_SECRET = 'test-secret-key';
process.env.NEXTAUTH_URL = 'http://localhost:3000'; // Keep hardcoded for test isolation

// Mock window for browser-specific code
if (typeof window === 'undefined') {
  global.window = {
    matchMedia: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
    location: { href: 'http://localhost:3000' },
    confirm: jest.fn().mockReturnValue(true),
  };
} else {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock document for browser-specific code
if (typeof document === 'undefined') {
  global.document = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    cookie: '',
  };
}

// Mock sessionStorage and localStorage
if (typeof sessionStorage === 'undefined') {
  const mockStorage = {};
  global.sessionStorage = {
    getItem: jest.fn((key) => mockStorage[key] || null),
    setItem: jest.fn((key, value) => {
      mockStorage[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete mockStorage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    }),
  };
}

if (typeof localStorage === 'undefined') {
  const mockStorage = {};
  global.localStorage = {
    getItem: jest.fn((key) => mockStorage[key] || null),
    setItem: jest.fn((key, value) => {
      mockStorage[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete mockStorage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    }),
  };
}
