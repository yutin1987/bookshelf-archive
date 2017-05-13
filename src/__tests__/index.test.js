import knex, { client } from 'jest-mock-knex';
import _ from 'lodash';
// import knex from 'knex';
import bookshelf from 'bookshelf';
import bookshelfArchive from '../';
import config from '../../knexfile';

process.setMaxListeners(0);

const sql = knex(config);
const db = bookshelf(sql);
db.plugin(bookshelfArchive);

const archive = ['more'];

class ClassModel extends db.Model {
  static tableName = 'class_table';
  static softDelete = false;
}

class StaticModel extends db.Model {
  static tableName = 'static_table';
  static hasTimestamps = true;
  static softDelete = true;
  static softField = 'disabled';
  static archive = archive;
  static archiveField = 'detail';
}

const ExtendModel = db.Model.extend({
  tableName: 'extend_table',
  softDelete: false,
});

const ProtoModel = db.Model.extend({
  tableName: 'proto_table',
  hasTimestamps: true,
  softDelete: true,
  softField: 'closed',
  archive,
});

const DefaultModel = db.Model.extend({
  tableName: 'default_table',
});

const data = {
  maxSize: 10,
  text: 'wow!! happy',
  more: { nickname: 'yutin', sex: true },
};

describe('bookshelf-archive', () => {
  beforeAll(async () => {
    await sql('class_table').truncate();
    await sql('static_table').truncate();
    await sql('extend_table').truncate();
    await sql('proto_table').truncate();
    await sql('default_table').truncate();
  });

  it('when insert', async () => {
    await _.reduce([{
      Model: ClassModel,
      query: {
        table: 'class_table',
        max_size: data.maxSize,
        text: data.text,
        more: JSON.stringify(data.more),
      },
    }, {
      Model: StaticModel,
      query: {
        table: 'static_table',
        max_size: data.maxSize,
        text: data.text,
        detail: JSON.stringify({ more: data.more }),
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      },
    }, {
      Model: ExtendModel,
      query: {
        table: 'extend_table',
        max_size: data.maxSize,
        text: data.text,
        more: JSON.stringify(data.more),
      },
    }, {
      Model: ProtoModel,
      query: {
        table: 'proto_table',
        max_size: data.maxSize,
        text: data.text,
        archive: JSON.stringify({ more: data.more }),
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
      },
    }, {
      Model: DefaultModel,
      query: {
        table: 'default_table',
        max_size: data.maxSize,
        text: data.text,
        more: JSON.stringify(data.more),
      },
    }], (result, { Model, query }) => result.then(async () => {
      await result;
      client.mockClear();
      const model = await new Model({ ...data }).save();
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
      expect(model.id).toBe('1');
    }), Promise.resolve());
  });

  it('when select', async () => {
    await _.reduce([{
      Model: ClassModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'class_table' },
    }, {
      Model: StaticModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
      query: { table: 'static_table', disabled: 'NULL' },
    }, {
      Model: ExtendModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'extend_table' },
    }, {
      Model: ProtoModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
      query: { table: 'proto_table', closed: 'NULL' },
    }, {
      Model: DefaultModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'default_table', deleted_at: 'NULL' },
    }], (result, { Model, reply, query }) => result.then(async () => {
      await result;
      client.mockClear();
      const model = await (new Model()).fetch();
      expect(client).toMatchSnapshot();
      expect(model.toJSON()).toEqual(expect.objectContaining(reply));
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
    }), Promise.resolve());
  });

  it('when select with where', async () => {
    await _.reduce([{
      Model: ClassModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'class_table', id: [1, 2], max_size: data.maxSize },
    }, {
      Model: StaticModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
      query: { table: 'static_table', id: [1, 2], disabled: 'NULL', max_size: data.maxSize },
    }, {
      Model: ExtendModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'extend_table', id: [1, 2], max_size: data.maxSize },
    }, {
      Model: ProtoModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
      query: { table: 'proto_table', id: [1, 2], closed: 'NULL', max_size: data.maxSize },
    }, {
      Model: DefaultModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'default_table', id: [1, 2], deleted_at: 'NULL', max_size: data.maxSize },
    }], (result, { Model, reply, query }) => result.then(async () => {
      client.mockClear();
      const model = new Model({ maxSize: data.maxSize });
      model.query('whereIn', 'id', [1, 2]);
      expect((await model.fetch()).toJSON()).toEqual(expect.objectContaining(reply));
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
    }), Promise.resolve());
  });

  it('when select all', async () => {
    await _.reduce([{
      Model: ClassModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'class_table' },
    }, {
      Model: StaticModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
      query: { table: 'static_table', disabled: 'NULL' },
    }, {
      Model: ExtendModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'extend_table' },
    }, {
      Model: ProtoModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
      query: { table: 'proto_table', closed: 'NULL' },
    }, {
      Model: DefaultModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'default_table', deleted_at: 'NULL' },
    }], (result, { Model, reply, query }) => result.then(async () => {
      client.mockClear();
      expect((await Model.fetchAll()).toJSON()[0]).toEqual(expect.objectContaining(reply));
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
    }), Promise.resolve());
  });

  it('when select use query', async () => {
    await _.reduce([{
      Model: ClassModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'class_table', max_size: data.maxSize },
    }, {
      Model: StaticModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
      query: { table: 'static_table', max_size: data.maxSize },
    }, {
      Model: ExtendModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'extend_table', max_size: data.maxSize },
    }, {
      Model: ProtoModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, createdAt: expect.any(Date), updatedAt: expect.any(Date) },
      query: { table: 'proto_table', max_size: data.maxSize },
    }, {
      Model: DefaultModel,
      reply: { ...data, id: '1', maxSize: `${data.maxSize}`, more: JSON.stringify(data.more) },
      query: { table: 'default_table', max_size: data.maxSize },
    }], (result, { Model, reply, query }) => result.then(async () => {
      client.mockClear();
      expect(
        (await Model.query().where('maxSize', data.maxSize).select('*'))[0],
      ).toEqual(expect.objectContaining(reply));
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
    }), Promise.resolve());
  });

  it('when update', async () => {
    await _.reduce([{
      Model: ClassModel,
      query: {
        table: 'class_table',
        more: JSON.stringify({ nickname: 'orz' }),
      },
    }, {
      Model: StaticModel,
      query: {
        table: 'static_table',
        detail: JSON.stringify({ more: { nickname: 'orz' } }),
      },
    }, {
      Model: ExtendModel,
      query: {
        table: 'extend_table',
        more: JSON.stringify({ nickname: 'orz' }),
      },
    }, {
      Model: ProtoModel,
      query: {
        table: 'proto_table',
        archive: JSON.stringify({ more: { nickname: 'orz' } }),
      },
    }, {
      Model: DefaultModel,
      query: {
        table: 'default_table',
        more: JSON.stringify({ nickname: 'orz' }),
      },
    }], (result, { Model, query }) => result.then(async () => {
      client.mockClear();
      await new Model({ id: 1 }).save({ maxSize: 99, more: { nickname: 'orz' } });
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining({ ...query, max_size: 99 }));
    }), Promise.resolve());
  });

  it('when destroy', async () => {
    await _.reduce([{
      Model: ClassModel,
      query: { table: 'class_table', method: 'delete' },
    }, {
      Model: StaticModel,
      query: { table: 'static_table', method: 'update', disabled: expect.any(Date) },
    }, {
      Model: ExtendModel,
      query: { table: 'extend_table', method: 'delete' },
    }, {
      Model: ProtoModel,
      query: { table: 'proto_table', method: 'update', closed: expect.any(Date) },
    }, {
      Model: DefaultModel,
      query: { table: 'default_table', method: 'update', deleted_at: expect.any(Date) },
    }], (result, { Model, query }) => result.then(async () => {
      client.mockClear();
      await new Model({ id: 1 }).destroy();
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
    }), Promise.resolve());

    client.mockClear();
    let error;
    try {
      await new DefaultModel({ id: 1 }).destroy({ require: true });
    } catch (e) { error = e; }
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
    expect(error.message).toEqual('No Rows Deleted');
  });
});
