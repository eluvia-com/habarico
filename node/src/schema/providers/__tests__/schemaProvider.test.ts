import {HttpError} from 'react-admin';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {getSchemaProvider, resolveRelativeUploadUrls} from '../schemaProvider';

const mockGetAuthHeaders = () => ({Authorization: 'Bearer test-token'});
const provider = getSchemaProvider(mockGetAuthHeaders);

describe('getSchemaProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getServiceSchema', () => {
    it('fetches from /schema/ endpoint', async () => {
      const mockSchema = [{name: 'articles', pk_field_name: 'id'}];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSchema),
      } as Response);

      await provider.getServiceSchema('blog', 'http://api.example.com', {});

      expect(fetch).toHaveBeenCalledWith(
        'http://api.example.com/schema/',
        expect.objectContaining({
          headers: expect.objectContaining({Authorization: 'Bearer test-token'}),
        })
      );
    });

    it('converts snake_case keys to camelCase', async () => {
      const mockSchema = [{name: 'articles', pk_field_name: 'id', has_create: true}];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSchema),
      } as Response);

      const result = await provider.getServiceSchema('blog', 'http://api.example.com', {});

      expect(result[0]).toHaveProperty('pkFieldName', 'id');
      expect(result[0]).toHaveProperty('hasCreate', true);
    });

    it('keeps the query parameters of a reference as they were sent', async () => {
      const mockSchema = [
        {
          name: 'articles',
          menu: {view: {endpoint: {resource: 'articles', params: {author_id: '1', _target: 'x'}}}},
        },
      ];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSchema),
      } as Response);

      const result = await provider.getServiceSchema('blog', 'http://api.example.com', {});

      expect(result[0].menu?.view?.endpoint?.params).toEqual({author_id: '1', _target: 'x'});
    });

    it('appends resource url from serviceUrl and name', async () => {
      const mockSchema = [{name: 'articles'}];
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSchema),
      } as Response);

      const result = await provider.getServiceSchema('blog', 'http://api.example.com', {});

      expect(result[0].url).toBe('http://api.example.com/articles/');
    });

    it('throws error when response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(provider.getServiceSchema('blog', 'http://api.example.com', {})).rejects.toThrow(
        'Failed to fetch schema for service: blog'
      );
    });

    it('passes Accept-Language header from params.meta.locale', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      await provider.getServiceSchema('blog', 'http://api.example.com', {meta: {locale: 'cs'}});

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({'Accept-Language': 'cs'}),
        })
      );
    });
  });

  describe('getRecordSchema', () => {
    it('fetches schema for a record URL', async () => {
      const mockSchema = {name: 'articles', pk_field_name: 'id'};
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSchema),
      } as Response);

      const result = await provider.getRecordSchema(
        'http://api.example.com/articles/',
        undefined,
        undefined,
        {}
      );

      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/schema/'), expect.any(Object));
      expect(result.url).toBe('http://api.example.com/articles/');
    });

    it('keeps the query parameters of a reference as they were sent', async () => {
      const mockSchema = {
        name: 'articles',
        views: [{endpoint: {method: 'get', reference: {resource: 'tags', params: {post_id: '1'}}}}],
      };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSchema),
      } as Response);

      const result = await provider.getRecordSchema('http://api.example.com/articles/');

      expect(result.views[0].endpoint.reference?.params).toEqual({post_id: '1'});
    });

    it('includes record id in the URL when provided', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await provider.getRecordSchema('http://api.example.com/articles/', undefined, 42, {});

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/42/schema/'),
        expect.any(Object)
      );
    });

    it('includes action name in the URL when provided', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await provider.getRecordSchema('http://api.example.com/articles/', 'publish', undefined, {});

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/publish/schema/'),
        expect.any(Object)
      );
    });

    it('encodes params containing URL-significant characters', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      await provider.getRecordSchema('http://api.example.com/articles/', undefined, undefined, {
        params: {q: 'a&b=c', count: 2, active: true},
      });

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      const url = new URL(calledUrl);
      expect(url.searchParams.get('q')).toBe('a&b=c');
      expect(url.searchParams.get('count')).toBe('2');
      expect(url.searchParams.get('active')).toBe('true');
    });
  });

  describe('listPreferences', () => {
    it('fetches from /user-preferences/ and reshapes to a record', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve([
            {key: 'dashboard', value: {widgets: ['a']}},
            {key: 'theme', value: 'dark'},
          ]),
      } as Response);

      const result = await provider.listPreferences!('http://api.example.com/v1/shop');

      expect(fetch).toHaveBeenCalledWith(
        'http://api.example.com/v1/shop/user-preferences/',
        expect.objectContaining({
          headers: expect.objectContaining({Authorization: 'Bearer test-token'}),
        })
      );
      expect(result).toEqual({dashboard: {widgets: ['a']}, theme: 'dark'});
    });

    it('strips trailing slash from serviceUrl', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      await provider.listPreferences!('http://api.example.com/v1/shop/');

      expect(fetch).toHaveBeenCalledWith(
        'http://api.example.com/v1/shop/user-preferences/',
        expect.any(Object)
      );
    });

    it('throws when response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue({ok: false, status: 503} as Response);

      await expect(provider.listPreferences!('http://api.example.com')).rejects.toThrow(
        'Failed to load user preferences (status 503)'
      );
    });
  });

  describe('setPreference', () => {
    it('PUTs to /user-preferences/{key}/ with JSON body and auth header', async () => {
      vi.mocked(fetch).mockResolvedValue({ok: true} as Response);

      await provider.setPreference!('http://api.example.com/v1/shop', 'dashboard', {x: 1});

      expect(fetch).toHaveBeenCalledWith(
        'http://api.example.com/v1/shop/user-preferences/dashboard/',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({x: 1}),
        })
      );
    });

    it('sends slashes verbatim for resource-style preference keys', async () => {
      vi.mocked(fetch).mockResolvedValue({ok: true} as Response);

      await provider.setPreference!(
        'http://api.example.com',
        'preferences.shop/orders.savedQueries',
        []
      );

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain('/user-preferences/preferences.shop/orders.savedQueries/');
      expect(calledUrl).not.toContain('%2F');
    });

    it('throws when response is not ok', async () => {
      vi.mocked(fetch).mockResolvedValue({ok: false, status: 500} as Response);

      await expect(
        provider.setPreference!('http://api.example.com', 'dashboard', {})
      ).rejects.toThrow('Failed to save preference "dashboard" (status 500)');
    });
  });

  describe('deletePreference', () => {
    it('sends slashes verbatim for resource-style preference keys', async () => {
      vi.mocked(fetch).mockResolvedValue({ok: true} as Response);

      await provider.deletePreference!(
        'http://api.example.com',
        'preferences.shop/orders.savedQueries'
      );

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain('/user-preferences/preferences.shop/orders.savedQueries/');
      expect(calledUrl).not.toContain('%2F');
    });
  });

  // The backend store reads the status to tell a rejected credential from a transient failure.
  describe('preference request errors', () => {
    it.each([
      ['listPreferences', () => provider.listPreferences!('http://api.example.com')],
      ['setPreference', () => provider.setPreference!('http://api.example.com', 'theme', 'dark')],
      ['deletePreference', () => provider.deletePreference!('http://api.example.com', 'theme')],
      ['deleteAllPreferences', () => provider.deleteAllPreferences!('http://api.example.com')],
    ])('%s rejects with an HttpError carrying the response status', async (_name, request) => {
      vi.mocked(fetch).mockResolvedValue({ok: false, status: 401} as Response);

      const error = await request().catch((e: unknown) => e);

      expect(error).toBeInstanceOf(HttpError);
      expect(error).toMatchObject({status: 401});
    });
  });
});

describe('resolveRelativeUploadUrls', () => {
  it('resolves relative initiateUrl and endpoint inside upload blocks', () => {
    const schema = {
      options: {
        upload: {
          provider: 's3-multipart',
          initiateUrl: '/admin/uploads/initiate/?model=a.b&field=c',
          endpoint: '/files/',
        },
      },
    };
    resolveRelativeUploadUrls(schema, 'https://api.example/v1/svc');
    expect(schema.options.upload.initiateUrl).toBe(
      'https://api.example/admin/uploads/initiate/?model=a.b&field=c'
    );
    expect(schema.options.upload.endpoint).toBe('https://api.example/files/');
  });

  it('leaves absolute URLs unchanged', () => {
    const schema = {options: {upload: {endpoint: 'https://tusd.example/files/'}}};
    resolveRelativeUploadUrls(schema, 'https://api.example/v1/svc');
    expect(schema.options.upload.endpoint).toBe('https://tusd.example/files/');
  });
});
