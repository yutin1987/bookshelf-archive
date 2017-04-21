/* eslint no-param-reassign: ["error", { "props": false }] */

import _ from 'lodash';
import knex, { client } from 'knex';
import bookshelf from 'bookshelf';
import bookshelfArchive from '../';

const db = bookshelf(knex());
db.plugin(bookshelfArchive);

const archive = ['venus', 'sun', 'user'];

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
  static archiveField = 'data';
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
  archiveField: 'more',
});

const DefaultModel = db.Model.extend({
  tableName: 'default_table',
});

const data = {
  id: 12,
  sed: 10,
  line: 'wow!! happy',
  venus: 99,
  sun: 'new time a day',
  user: { nickname: 'yutin', sex: true },
  card: { max: 99 },
};

const starBox = 'big';

describe('bookshelf-archive', () => {
  it('when select', async () => {
    await _.reduce([{
      Model: ClassModel,
      response: { archive: JSON.stringify(_.pick(data, archive)) },
      reply: { ..._.omit(data, archive), archive: JSON.stringify(_.pick(data, archive)) },
      query: { table: 'class_table' },
    }, {
      Model: StaticModel,
      response: { data: JSON.stringify(_.pick(data, archive)) },
      reply: { ...data },
      query: { table: 'static_table', disabled: 'NULL' },
    }, {
      Model: ExtendModel,
      response: { archive: JSON.stringify(_.pick(data, archive)) },
      reply: { ..._.omit(data, archive), archive: JSON.stringify(_.pick(data, archive)) },
      query: { table: 'extend_table' },
    }, {
      Model: ProtoModel,
      response: { more: JSON.stringify(_.pick(data, archive)) },
      reply: { ...data },
      query: { table: 'proto_table', closed: 'NULL' },
    }, {
      Model: DefaultModel,
      response: { archive: JSON.stringify(_.pick(data, archive)) },
      reply: { ..._.omit(data, archive), archive: JSON.stringify(_.pick(data, archive)) },
      query: { table: 'default_table', deleted_at: 'NULL' },
    }], (result, { Model, response, reply, query }) => result.then(async () => {
      const model = new Model();
      client.mockClear();
      client.mockReturnValueOnce([{ ..._.omit(data, archive), ...response, star_box: starBox }]);
      const node = await model.fetch();
      expect(node.toJSON()).toEqual({ ...reply, starBox });
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
    }), Promise.resolve());
  });

  it('when select with where', async () => {
    await _.reduce([{
      Model: ClassModel,
      query: { table: 'class_table', star_box: starBox },
    }, {
      Model: StaticModel,
      query: { table: 'static_table', disabled: 'NULL', star_box: starBox },
    }, {
      Model: ExtendModel,
      query: { table: 'extend_table', star_box: starBox },
    }, {
      Model: ProtoModel,
      query: { table: 'proto_table', closed: 'NULL', star_box: starBox },
    }, {
      Model: DefaultModel,
      query: { table: 'default_table', deleted_at: 'NULL', star_box: starBox },
    }], (result, { Model, query }) => result.then(async () => {
      const model = new Model({ starBox });
      client.mockClear();
      client.mockReturnValueOnce([{ ..._.omit(data, archive), star_box: starBox }]);
      expect((await model.fetch()).toJSON()).toEqual({ ..._.omit(data, archive), starBox });
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
    }), Promise.resolve());
  });

  it('when select all', async () => {
    await _.reduce([{
      Model: ClassModel,
      response: { archive: JSON.stringify(_.pick(data, archive)) },
      reply: { ..._.omit(data, archive), archive: JSON.stringify(_.pick(data, archive)) },
      query: { table: 'class_table' },
    }, {
      Model: StaticModel,
      response: { data: JSON.stringify(_.pick(data, archive)) },
      reply: { ...data },
      query: { table: 'static_table', disabled: 'NULL' },
    }, {
      Model: ExtendModel,
      response: { archive: JSON.stringify(_.pick(data, archive)) },
      reply: { ..._.omit(data, archive), archive: JSON.stringify(_.pick(data, archive)) },
      query: { table: 'extend_table' },
    }, {
      Model: ProtoModel,
      response: { more: JSON.stringify(_.pick(data, archive)) },
      reply: { ...data },
      query: { table: 'proto_table', closed: 'NULL' },
    }, {
      Model: DefaultModel,
      response: { archive: JSON.stringify(_.pick(data, archive)) },
      reply: { ..._.omit(data, archive), archive: JSON.stringify(_.pick(data, archive)) },
      query: { table: 'default_table', deleted_at: 'NULL' },
    }], (result, { Model, response, reply, query }) => result.then(async () => {
      client.mockClear();
      client.mockReturnValueOnce([{ ..._.omit(data, archive), ...response, star_box: starBox }]);
      expect((await Model.fetchAll()).toJSON()).toEqual([{ ...reply, starBox }]);
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
    }), Promise.resolve());
  });

  it('when select use query', async () => {
    await _.reduce([{
      Model: ClassModel,
      query: { table: 'class_table', star_box: starBox },
    }, {
      Model: StaticModel,
      query: { table: 'static_table', star_box: starBox },
    }, {
      Model: ExtendModel,
      query: { table: 'extend_table', star_box: starBox },
    }, {
      Model: ProtoModel,
      query: { table: 'proto_table', star_box: starBox },
    }, {
      Model: DefaultModel,
      query: { table: 'default_table', star_box: starBox },
    }], (result, { Model, query }) => result.then(async () => {
      client.mockClear();
      client.mockReturnValueOnce([{ ..._.omit(data, archive), star_box: starBox }]);
      expect(await Model.query().where('starBox', starBox).select('*')).toEqual([{ ..._.omit(data, archive), starBox }]);
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
    }), Promise.resolve());
  });

  it('when insert', async () => {
    await _.reduce([{
      Model: ClassModel,
      query: {
        table: 'class_table',
        star_box: starBox,
        ..._.omit(data, ['id', 'user', 'card']),
        user: JSON.stringify(data.user),
        card: JSON.stringify(data.card),
      },
    }, {
      Model: StaticModel,
      query: {
        table: 'static_table',
        star_box: starBox,
        ..._.omit(data, _.concat('id', archive, 'card')),
        data: JSON.stringify(_.pick(data, archive)),
        card: JSON.stringify(data.card),
      },
    }, {
      Model: ExtendModel,
      query: {
        table: 'extend_table',
        star_box: starBox,
        ..._.omit(data, ['id', 'user', 'card']),
        user: JSON.stringify(data.user),
        card: JSON.stringify(data.card),
      },
    }, {
      Model: ProtoModel,
      query: {
        table: 'proto_table',
        star_box: starBox,
        ..._.omit(data, _.concat('id', archive, 'card')),
        more: JSON.stringify(_.pick(data, archive)),
        card: JSON.stringify(data.card),
      },
    }, {
      Model: DefaultModel,
      query: {
        table: 'default_table',
        star_box: starBox,
        ..._.omit(data, ['id', 'user', 'card']),
        user: JSON.stringify(data.user),
        card: JSON.stringify(data.card),
      },
    }], (result, { Model, query }) => result.then(async () => {
      client.mockClear();
      client.mockReturnValueOnce([data.id]);
      const model = await new Model({ ..._.omit(data, 'id'), starBox }).save();
      expect(model.id).toBe(data.id);
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
        star_box: starBox,
        ..._.omit(data, ['id', 'user', 'card']),
        user: JSON.stringify(data.user),
        card: JSON.stringify(data.card),
      },
    }, {
      Model: StaticModel,
      query: {
        table: 'static_table',
        star_box: starBox,
        ..._.omit(data, _.concat('id', archive, 'card')),
        data: JSON.stringify(_.pick(data, archive)),
        card: JSON.stringify(data.card),
      },
    }, {
      Model: ExtendModel,
      query: {
        table: 'extend_table',
        star_box: starBox,
        ..._.omit(data, ['id', 'user', 'card']),
        user: JSON.stringify(data.user),
        card: JSON.stringify(data.card),
      },
    }, {
      Model: ProtoModel,
      query: {
        table: 'proto_table',
        star_box: starBox,
        ..._.omit(data, _.concat('id', archive, 'card')),
        more: JSON.stringify(_.pick(data, archive)),
        card: JSON.stringify(data.card),
      },
    }, {
      Model: DefaultModel,
      query: {
        table: 'default_table',
        star_box: starBox,
        ..._.omit(data, ['id', 'user', 'card']),
        user: JSON.stringify(data.user),
        card: JSON.stringify(data.card),
      },
    }], (result, { Model, query }) => result.then(async () => {
      client.mockClear();
      client.mockReturnValueOnce([1]);
      await new Model({ id: data.id }).save({ ..._.omit(data, 'id'), starBox });
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
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
      client.mockReturnValueOnce([1]);
      await new Model({ id: data.id }).destroy();
      expect(client).toMatchSnapshot();
      expect(client).toHaveBeenCalledTimes(1);
      expect(client).toHaveBeenLastCalledWith(expect.objectContaining(query));
    }), Promise.resolve());

    client.mockClear();
    client.mockReturnValueOnce(0);
    let error;
    try {
      await new DefaultModel({ id: data.id }).destroy({ require: true });
    } catch (e) { error = e; }
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
    expect(error.message).toEqual('No Rows Deleted');
  });
});

