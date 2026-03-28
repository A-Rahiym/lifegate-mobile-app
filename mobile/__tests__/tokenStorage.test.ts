/**
 * Unit tests for tokenStorage.ts
 *
 * Covers:
 *  - saveToken / getToken / removeToken with SecureStore available
 *  - Fallback to AsyncStorage when SecureStore methods are missing
 *  - isTokenValid returns true/false correctly
 *
 * Uses require() instead of dynamic import() for CommonJS Jest compatibility.
 * jest.resetModules() in beforeEach ensures each test gets a fresh module instance.
 */

// ─── Shared mock objects ──────────────────────────────────────────────────────
// Variables starting with 'mock' are exempt from jest-hoist's scope restriction.

const mockSecureStore: Record<string, jest.Mock | undefined> = {
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
};

const mockAsyncStorage = {
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
};

// __esModule: true makes _interopRequireWildcard return the object directly,
// so that mutations to mockSecureStore are visible inside tokenStorage.ts.
jest.mock('expo-secure-store', () => ({ __esModule: true, ...mockSecureStore }));
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: mockAsyncStorage,
}));

// ─── Setup ────────────────────────────────────────────────────────────────────

const TOKEN_KEY = 'lifegate_token';

beforeEach(() => {
  // Clear the module registry so each test loads a fresh tokenStorage instance.
  jest.resetModules();
  // Reassign (not .mockReset on potentially-undefined) to safely restore SecureStore.
  mockSecureStore.setItemAsync = jest.fn().mockResolvedValue(undefined);
  mockSecureStore.getItemAsync = jest.fn().mockResolvedValue(null);
  mockSecureStore.deleteItemAsync = jest.fn().mockResolvedValue(undefined);
  // Reset AsyncStorage mocks.
  mockAsyncStorage.setItem.mockReset().mockResolvedValue(undefined);
  mockAsyncStorage.getItem.mockReset().mockResolvedValue(null);
  mockAsyncStorage.removeItem.mockReset().mockResolvedValue(undefined);
});

// Helper: re-require tokenStorage after modules are reset.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const requireModule = () => require('../utils/tokenStorage') as typeof import('../utils/tokenStorage');

// ─── Tests: SecureStore available ────────────────────────────────────────────

describe('tokenStorage — SecureStore available', () => {
  it('saveToken calls SecureStore.setItemAsync', async () => {
    const { saveToken } = requireModule();
    await saveToken('my-jwt-token');
    expect(mockSecureStore.setItemAsync).toHaveBeenCalledWith(TOKEN_KEY, 'my-jwt-token');
    expect(mockAsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('getToken calls SecureStore.getItemAsync and returns value', async () => {
    mockSecureStore.getItemAsync = jest.fn().mockResolvedValue('stored-token');
    const { getToken } = requireModule();
    const token = await getToken();
    expect(token).toBe('stored-token');
    expect(mockSecureStore.getItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
  });

  it('getToken returns null when no token stored', async () => {
    const { getToken } = requireModule();
    const token = await getToken();
    expect(token).toBeNull();
  });

  it('removeToken calls SecureStore.deleteItemAsync', async () => {
    const { removeToken } = requireModule();
    await removeToken();
    expect(mockSecureStore.deleteItemAsync).toHaveBeenCalledWith(TOKEN_KEY);
    expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
  });

  it('isTokenValid returns true when token exists', async () => {
    mockSecureStore.getItemAsync = jest.fn().mockResolvedValue('valid-token');
    const { isTokenValid } = requireModule();
    expect(await isTokenValid()).toBe(true);
  });

  it('isTokenValid returns false when no token', async () => {
    const { isTokenValid } = requireModule();
    expect(await isTokenValid()).toBe(false);
  });
});

// ─── Tests: SecureStore NOT available (fallback) ──────────────────────────────

describe('tokenStorage — AsyncStorage fallback (SecureStore unavailable)', () => {
  beforeEach(() => {
    // Simulate SecureStore methods missing (older Expo Go runtime).
    // Outer beforeEach already ran and reassigned these to jest.fn(), so it's
    // safe to set them to undefined here.
    mockSecureStore.setItemAsync = undefined;
    mockSecureStore.getItemAsync = undefined;
    mockSecureStore.deleteItemAsync = undefined;
  });

  it('saveToken falls back to AsyncStorage.setItem', async () => {
    const { saveToken } = requireModule();
    await saveToken('fallback-token');
    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(TOKEN_KEY, 'fallback-token');
  });

  it('getToken falls back to AsyncStorage.getItem', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('async-token');
    const { getToken } = requireModule();
    const token = await getToken();
    expect(token).toBe('async-token');
    expect(mockAsyncStorage.getItem).toHaveBeenCalledWith(TOKEN_KEY);
  });

  it('removeToken falls back to AsyncStorage.removeItem', async () => {
    const { removeToken } = requireModule();
    await removeToken();
    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith(TOKEN_KEY);
  });

  it('isTokenValid returns false when AsyncStorage has no token', async () => {
    const { isTokenValid } = requireModule();
    expect(await isTokenValid()).toBe(false);
  });
});
