import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ActionResult} from '@schema/types';
import {getDataProviderFactory} from '../dataProvider';

// Mock react-admin's fetchUtils
vi.mock('react-admin', async () => {
  const actual = await vi.importActual<typeof import('react-admin')>('react-admin');
  return {
    ...actual,
    fetchUtils: {
      fetchJson: vi.fn(),
    },
  };
});

const mockGetAuthHeaders = () => ({Authorization: 'Bearer test'});

const testServicesSchema = {
  blog: [
    {
      name: 'articles',
      url: 'http://api.example.com/articles/',
      pkFieldName: 'id',
    },
    {
      name: 'tags',
      url: 'http://api.example.com/tags/',
      pkFieldName: 'name',
    },
  ],
};

describe('getDataProviderFactory', () => {
  let dataProvider: ReturnType<typeof getDataProviderFactory>;
  let fetchJson: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const {fetchUtils} = await import('react-admin');
    fetchJson = vi.mocked(fetchUtils.fetchJson);
    dataProvider = getDataProviderFactory(testServicesSchema as any, mockGetAuthHeaders);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getOne', () => {
    it('fetches correct URL with record id', async () => {
      fetchJson.mockResolvedValue({
        json: {id: 1, title: 'Test Article'},
        status: 200,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.getOne('blog/articles', {id: 1});

      expect(fetchJson).toHaveBeenCalledWith(
        'http://api.example.com/articles/1/',
        expect.any(Object)
      );
      expect(result.data).toMatchObject({id: 1, title: 'Test Article'});
    });

    it('encodes a record id containing URL-significant characters', async () => {
      fetchJson.mockResolvedValue({
        json: {id: 'a/b?c'},
        status: 200,
        headers: new Headers(),
        body: '',
      });

      await dataProvider.getOne('blog/articles', {id: 'a/b?c'});

      expect(fetchJson).toHaveBeenCalledWith(
        'http://api.example.com/articles/a%2Fb%3Fc/',
        expect.any(Object)
      );
    });
  });

  describe('getList', () => {
    it('fetches correct URL with pagination and sort', async () => {
      fetchJson.mockResolvedValue({
        json: {
          objects: [{id: 1}, {id: 2}],
          meta: {total_count: 2},
        },
        status: 200,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.getList('blog/articles', {
        pagination: {page: 1, perPage: 10},
        sort: {field: 'id', order: 'ASC'},
        filter: {},
      });

      expect(fetchJson).toHaveBeenCalledWith(
        expect.stringContaining('articles/'),
        expect.any(Object)
      );
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });

  describe('create', () => {
    it('sends POST with body and returns created record', async () => {
      fetchJson.mockResolvedValue({
        json: {id: 5, title: 'New Article'},
        status: 201,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.create('blog/articles', {
        data: {title: 'New Article'},
      });

      expect(fetchJson).toHaveBeenCalledWith(
        'http://api.example.com/articles/',
        expect.objectContaining({method: 'POST'})
      );
      expect(result.data).toMatchObject({id: 5, title: 'New Article'});
    });
  });

  describe('update', () => {
    it('sends PUT with body and returns updated record', async () => {
      fetchJson.mockResolvedValue({
        json: {id: 1, title: 'Updated Article'},
        status: 200,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.update('blog/articles', {
        id: 1,
        data: {title: 'Updated Article'},
        previousData: {id: 1} as any,
      });

      expect(fetchJson).toHaveBeenCalledWith(
        'http://api.example.com/articles/1/',
        expect.objectContaining({method: 'PUT'})
      );
      expect(result.data).toMatchObject({id: 1, title: 'Updated Article'});
    });

    it('encodes a record id containing URL-significant characters', async () => {
      fetchJson.mockResolvedValue({
        json: {id: 'a/b?c'},
        status: 200,
        headers: new Headers(),
        body: '',
      });

      await dataProvider.update('blog/articles', {
        id: 'a/b?c',
        data: {},
        previousData: {id: 'a/b?c'} as any,
      });

      expect(fetchJson).toHaveBeenCalledWith(
        'http://api.example.com/articles/a%2Fb%3Fc/',
        expect.objectContaining({method: 'PUT'})
      );
    });
  });

  describe('delete', () => {
    it('sends DELETE request to the correct URL', async () => {
      fetchJson.mockResolvedValue({
        json: {},
        status: 204,
        headers: new Headers(),
        body: '',
      });

      await dataProvider.delete('blog/articles', {id: 3, previousData: {id: 3} as any});

      expect(fetchJson).toHaveBeenCalledWith(
        'http://api.example.com/articles/3/',
        expect.objectContaining({method: 'DELETE'})
      );
    });

    it('encodes a record id containing URL-significant characters', async () => {
      fetchJson.mockResolvedValue({
        json: {},
        status: 204,
        headers: new Headers(),
        body: '',
      });

      await dataProvider.delete('blog/articles', {
        id: 'a/b?c',
        previousData: {id: 'a/b?c'} as any,
      });

      expect(fetchJson).toHaveBeenCalledWith(
        'http://api.example.com/articles/a%2Fb%3Fc/',
        expect.objectContaining({method: 'DELETE'})
      );
    });
  });

  describe('export', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    const mockFetchResponse = (overrides: Partial<Response> = {}) => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({'Content-Disposition': 'attachment; filename="articles.csv"'}),
        blob: async () => new Blob(['a,b\n1,2'], {type: 'text/csv'}),
        json: async () => ({}),
        ...overrides,
      });
    };

    beforeEach(() => {
      fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('calls the export endpoint with format, fields and ids and returns blob with filename', async () => {
      mockFetchResponse();

      const result = await dataProvider.export('blog/articles', {
        format: 'csv',
        fields: ['name', 'price'],
        ids: [1, 2],
      });

      const [calledUrl, options] = fetchMock.mock.calls[0];
      const url = new URL(calledUrl);
      expect(url.origin + url.pathname).toBe('http://api.example.com/articles/export/');
      expect(url.searchParams.get('format')).toBe('csv');
      expect(url.searchParams.get('fields')).toBe('name,price');
      expect(url.searchParams.get('ids')).toBe('1,2');
      expect((options.headers as Headers).get('Authorization')).toBe('Bearer test');
      expect(result.status).toBe(200);
      expect(result.blob).toBeInstanceOf(Blob);
      expect(result.filename).toBe('articles.csv');
    });

    it('serializes filter and order_by in the getList format when no ids are given', async () => {
      mockFetchResponse();

      await dataProvider.export('blog/articles', {
        format: 'csv',
        filter: {name: 'x', search_query: 'abc'},
        sort: {field: 'title', order: 'DESC'},
      });

      const url = new URL(fetchMock.mock.calls[0][0]);
      expect(url.searchParams.get('filter')).toBe('name="x"&search="abc"');
      expect(url.searchParams.get('order_by')).toBe('title:desc');
      expect(url.searchParams.get('ids')).toBeNull();
    });

    it('falls back to the pk field in order_by when no sort is given', async () => {
      mockFetchResponse();

      await dataProvider.export('blog/articles', {format: 'csv'});

      const url = new URL(fetchMock.mock.calls[0][0]);
      expect(url.searchParams.get('order_by')).toBe('id:asc');
    });

    it('parses RFC 5987 filename* from Content-Disposition', async () => {
      mockFetchResponse({
        headers: new Headers({
          'Content-Disposition': "attachment; filename*=UTF-8''r%C3%A9sum%C3%A9.csv",
        }),
      });

      const result = await dataProvider.export('blog/articles', {format: 'csv'});

      expect(result.filename).toBe('résumé.csv');
    });

    it('returns undefined filename when Content-Disposition is missing', async () => {
      mockFetchResponse({headers: new Headers()});

      const result = await dataProvider.export('blog/articles', {format: 'csv'});

      expect(result.filename).toBeUndefined();
    });

    it('returns only the status for 202 responses', async () => {
      mockFetchResponse({status: 202, blob: undefined});

      const result = await dataProvider.export('blog/articles', {format: 'csv'});

      expect(result.status).toBe(202);
      expect(result.blob).toBeUndefined();
    });

    it('throws on error responses', async () => {
      mockFetchResponse({ok: false, status: 400});

      await expect(dataProvider.export('blog/articles', {format: 'csv'})).rejects.toThrow();
    });
  });

  describe('callAction', () => {
    it('sends request to resource URL with given method', async () => {
      fetchJson.mockResolvedValue({
        json: {status: 'ok'},
        status: 200,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.callAction('blog/articles', 'post', 'publish', {
        id: 1,
        data: {},
      });

      expect(fetchJson).toHaveBeenCalledWith(
        expect.stringContaining('articles/1/publish'),
        expect.objectContaining({method: 'POST'})
      );
      expect(result.data).toMatchObject({status: 'ok'});
    });

    it('encodes a record id containing URL-significant characters', async () => {
      fetchJson.mockResolvedValue({
        json: {status: 'ok'},
        status: 200,
        headers: new Headers(),
        body: '',
      });

      await dataProvider.callAction('blog/articles', 'post', 'publish', {
        id: 'a/b?c',
        data: {},
      });

      expect(fetchJson).toHaveBeenCalledWith(
        expect.stringContaining('articles/a%2Fb%3Fc/publish'),
        expect.objectContaining({method: 'POST'})
      );
    });
  });

  describe('references in meta', () => {
    const view = (reference: object) => ({
      name: 'show',
      choices: [],
      mode: 'redirect',
      parameters: {},
      reference,
    });

    it('fills the service of the resource into the actions a record carries', async () => {
      fetchJson.mockResolvedValue({
        json: {
          id: 1,
          meta: {
            schema: {
              name: 'articles',
              actions: [{name: 'open', type: 'view', view: view({resource: 'tags'})}],
            },
          },
        },
        status: 200,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.getOne('blog/articles', {id: 1});

      expect(result.data.meta.schema.actions[0].view.reference).toEqual({
        service: 'blog',
        resource: 'tags',
      });
    });

    it('fills the service into the action an action result triggers', async () => {
      fetchJson.mockResolvedValue({
        json: {
          meta: {
            state: 'success',
            trigger_action: {type: 'view', view: view({resource: 'tags', record_pk: 3})},
          },
        },
        status: 200,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.callAction('blog/articles', 'post', 'publish', {
        id: 1,
        data: {},
      });

      expect((result.data as ActionResult).meta.triggerAction?.view?.reference).toEqual({
        service: 'blog',
        resource: 'tags',
        recordPk: 3,
      });
    });

    it('keeps a service the backend named', async () => {
      fetchJson.mockResolvedValue({
        json: {
          meta: {trigger_action: {type: 'view', view: view({service: 'shop', resource: 'orders'})}},
        },
        status: 200,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.callAction('blog/articles', 'post', 'publish', {
        id: 1,
        data: {},
      });

      expect((result.data as ActionResult).meta.triggerAction?.view?.reference).toEqual({
        service: 'shop',
        resource: 'orders',
      });
    });
  });

  describe('record identifier', () => {
    it('derives the id from pkFieldName even when the record carries its own id field', async () => {
      fetchJson.mockResolvedValue({
        json: {id: 2, name: 'consumable', label: 'Consumable'},
        status: 200,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.getOne('blog/tags', {id: 'consumable'});

      expect(result.data.id).toBe('consumable');
    });

    it('derives the id from pkFieldName for every record of a list', async () => {
      fetchJson.mockResolvedValue({
        json: {
          objects: [
            {id: 2, name: 'consumable'},
            {id: 7, name: 'holdable'},
          ],
          meta: {total_count: 2},
        },
        status: 200,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.getList('blog/tags', {
        pagination: {page: 1, perPage: 10},
        sort: {field: 'name', order: 'ASC'},
        filter: {},
      });

      expect(result.data.map((record) => record.id)).toEqual(['consumable', 'holdable']);
    });

    it('falls back to the id field when the record does not carry pkFieldName', async () => {
      fetchJson.mockResolvedValue({
        json: {id: 2, label: 'Consumable'},
        status: 200,
        headers: new Headers(),
        body: '',
      });

      const result = await dataProvider.getOne('blog/tags', {id: 2});

      expect(result.data.id).toBe(2);
    });
  });

  describe('Accept-Language', () => {
    const sentLocale = () => {
      const {headers} = fetchJson.mock.calls[fetchJson.mock.calls.length - 1][1];
      return (headers as Headers).get('Accept-Language');
    };

    beforeEach(() => {
      fetchJson.mockResolvedValue({
        json: {objects: [], meta: {total_count: 0}},
        status: 200,
        headers: new Headers(),
        body: '',
      });
    });

    it('sends the locale from params.meta', async () => {
      await dataProvider.getList('blog/articles', {
        pagination: {page: 1, perPage: 10},
        sort: {field: 'id', order: 'ASC'},
        filter: {},
        meta: {locale: 'cs'},
      });

      expect(sentLocale()).toBe('cs');
    });

    it('omits the header when no locale has been seen', async () => {
      await dataProvider.getList('blog/articles', {
        pagination: {page: 1, perPage: 10},
        sort: {field: 'id', order: 'ASC'},
        filter: {},
      });

      expect(sentLocale()).toBeNull();
    });

    it('does not leak a locale from an earlier request into a later one', async () => {
      const params = {
        pagination: {page: 1, perPage: 10},
        sort: {field: 'id', order: 'ASC' as const},
        filter: {},
      };

      await dataProvider.getList('blog/articles', {...params, meta: {locale: 'cs'}});
      await dataProvider.getList('blog/articles', params);

      expect(sentLocale()).toBeNull();
    });

    it('sends the locale on callAction', async () => {
      await dataProvider.callAction('blog/articles', 'post', 'publish', {
        id: 1,
        data: {},
        meta: {locale: 'cs'},
      });

      expect(sentLocale()).toBe('cs');
    });
  });
});
