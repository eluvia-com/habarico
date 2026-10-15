import {jwtDecode} from 'jwt-decode';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {buildServiceAuthProvider} from '../buildServiceAuthProvider';

vi.mock('jwt-decode', () => ({jwtDecode: vi.fn()}));

vi.mock('@admin/utils/api', () => ({handleErrorResponse: vi.fn()}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  roles: [],
  is_active: true,
  has_temporary_password: false,
  permissions: [],
  created_at: '',
  updated_at: '',
};

const getAuthData = vi.fn();
const clearAuthData = vi.fn();

const makeInputs = () => ({
  login: vi.fn(),
  logout: vi.fn(),
  getMfaMethods: vi.fn(),
  requestMfaChallenge: vi.fn(),
  verifyMfaCode: vi.fn(),
  forgottenPassword: vi.fn(),
  resetPassword: vi.fn(),
  changePassword: vi.fn(),
  updateUser: vi.fn(),
  getAuthData,
  clearAuthData,
  getAuthHeaders: vi.fn(),
});

describe('buildServiceAuthProvider', () => {
  let inputs: ReturnType<typeof makeInputs>;
  let provider: ReturnType<typeof buildServiceAuthProvider>;

  beforeEach(() => {
    inputs = makeInputs();
    provider = buildServiceAuthProvider(inputs);
    getAuthData.mockReturnValue({user: undefined});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  describe('logout', () => {
    it('calls the logout input when user is logged in', async () => {
      getAuthData.mockReturnValue({user: mockUser});
      await provider.logout({});
      expect(inputs.logout).toHaveBeenCalledOnce();
    });

    it('does not call the logout input when no user is logged in', async () => {
      await provider.logout({});
      expect(inputs.logout).not.toHaveBeenCalled();
    });

    it('does not clear auth data itself — the logout input does it after the server call', async () => {
      // Clearing auth data before the server logout drops the auth header, so the
      // backend logout never runs (VD-2710). The logout input owns the clearing.
      getAuthData.mockReturnValue({user: mockUser});
      let clearedBeforeLogout = false;
      inputs.logout.mockImplementation(async () => {
        clearedBeforeLogout = clearAuthData.mock.calls.length > 0;
      });
      await provider.logout({});
      expect(clearedBeforeLogout).toBe(false);
      expect(clearAuthData).not.toHaveBeenCalled();
    });
  });

  describe('checkError', () => {
    it('clears auth data and rejects on 401', async () => {
      await expect(provider.checkError({status: 401})).rejects.toBeUndefined();
      expect(clearAuthData).toHaveBeenCalledOnce();
    });

    it('resolves and does not clear auth data on non-401 errors', async () => {
      await expect(provider.checkError({status: 403})).resolves.toBeUndefined();
      await expect(provider.checkError({status: 500})).resolves.toBeUndefined();
      expect(clearAuthData).not.toHaveBeenCalled();
    });
  });

  describe('checkAuth', () => {
    it('resolves when user is logged in', async () => {
      getAuthData.mockReturnValue({user: mockUser});
      await expect(provider.checkAuth({})).resolves.toBeUndefined();
    });

    it('rejects when no user', async () => {
      await expect(provider.checkAuth({})).rejects.toBeUndefined();
    });

    it('resolves on reset-password path regardless of auth state', async () => {
      vi.stubGlobal('location', {pathname: '/reset-password/abc123'});
      await expect(provider.checkAuth({})).resolves.toBeUndefined();
    });
  });

  describe('getPermissions', () => {
    it('returns logged-user when authenticated', async () => {
      getAuthData.mockReturnValue({user: mockUser});
      await expect(provider.getPermissions!({})).resolves.toBe('logged-user');
    });

    it('returns guest when not authenticated', async () => {
      await expect(provider.getPermissions!({})).resolves.toBe('guest');
    });
  });

  describe('getIdentity', () => {
    it('rejects when no user', async () => {
      await expect(provider.getIdentity()).rejects.toBeUndefined();
    });

    it('returns mapped identity for a logged-in user', async () => {
      getAuthData.mockReturnValue({user: mockUser});
      vi.mocked(jwtDecode).mockReturnValue({});

      const identity = await provider.getIdentity();

      expect(identity.id).toBe(mockUser.id);
      expect(identity.email).toBe(mockUser.username);
      expect(identity.fullName).toBe(mockUser.email); // no first/last name — falls back to email
    });

    it('builds fullName from first and last name when available', async () => {
      getAuthData.mockReturnValue({
        user: {...mockUser, first_name: 'Jane', last_name: 'Doe'},
      });
      vi.mocked(jwtDecode).mockReturnValue({});

      const identity = await provider.getIdentity();

      expect(identity.fullName).toBe('Jane Doe');
    });

    it('includes originalUser from JWT payload when impersonating', async () => {
      const adminUser = {...mockUser, id: 'admin-id', username: 'admin'};
      getAuthData.mockReturnValue({
        user: mockUser,
        jwt: {access: 'token', refresh: 'refresh'},
      });
      vi.mocked(jwtDecode).mockReturnValue({original_user: adminUser});

      const identity = await provider.getIdentity();

      expect(identity.originalUser).toBeDefined();
      expect(identity.originalUser?.id).toBe(adminUser.id);
      expect(identity.originalUser?.email).toBe(adminUser.username);
    });

    it('does not include originalUser when not impersonating', async () => {
      getAuthData.mockReturnValue({
        user: mockUser,
        jwt: {access: 'token', refresh: 'refresh'},
      });
      vi.mocked(jwtDecode).mockReturnValue({});

      const identity = await provider.getIdentity();

      expect(identity.originalUser).toBeUndefined();
    });
  });

  describe('updateIdentity', () => {
    it('maps identity fields to user fields and calls updateUser', async () => {
      inputs.updateUser.mockResolvedValue(new Response());

      await provider.updateIdentity({
        email: 'newname',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(inputs.updateUser).toHaveBeenCalledWith({
        username: 'newname', // email maps to username, not email
        first_name: 'Jane',
        last_name: 'Doe',
      });
    });

    it('includes avatar when both filename and content are provided', async () => {
      inputs.updateUser.mockResolvedValue(new Response());

      await provider.updateIdentity({
        avatarFilename: 'photo.jpg',
        avatarContent: 'base64data',
      });

      expect(inputs.updateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar: {filename: 'photo.jpg', content: 'base64data'},
        })
      );
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when user is logged in', () => {
      getAuthData.mockReturnValue({user: mockUser});
      expect(provider.isAuthenticated()).toBe(true);
    });

    it('returns false when not logged in', () => {
      expect(provider.isAuthenticated()).toBe(false);
    });
  });
});
