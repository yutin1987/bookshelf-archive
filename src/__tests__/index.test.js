/* eslint no-param-reassign: ["error", { "props": false }] */

import _ from 'lodash';
import faker from 'faker';
import knex, { query } from 'knex';
import { toHaveBeenLastQueriedWith } from 'jest-expect-queried';
import bookshelf from 'bookshelf';
import bookshelfArchive from '../';

const orm = bookshelf(knex());
orm.plugin(bookshelfArchive);

const ArchiveModel = orm.Model.extend({
  tableName: 'tableName',
  hasTimestamps: true,
  archive: ['venus', 'sun', 'moon', 'user'],
});

const Model = orm.Model.extend({
  tableName: 'tableName',
  hasTimestamps: true,
});

const data = {
  sedNumber: _.random(1, 999),
  autString: faker.lorem.word(),
  deepLine: faker.lorem.lines(),
  venus: _.random(1, 999),
  sun: faker.lorem.word(),
  moon: faker.lorem.word(),
  user: faker.helpers.userCard(),
};

beforeEach(() => {
  jest.addMatchers({ toHaveBeenLastQueriedWith });
});

describe('bookshelf-pretty help', () => {
  it('when save', async () => {
    const model = new ArchiveModel();

    query.mockClear();
    await model.save({ ...data });
    expect(query).toHaveBeenLastQueriedWith({
      method: 'insert',
      table: 'tableName',
      sed_number: data.sedNumber,
      aut_string: data.autString,
      deep_line: data.deepLine,
      archive: {
        venus: data.venus,
        sun: data.sun,
        moon: data.moon,
        user: data.user,
      },
      createdAt: Date,
      updatedAt: Date,
    });
  });

  it('when save when archive is undefined', async () => {
    const model = new Model();

    query.mockClear();
    await model.save({ ...data, user: JSON.stringify(data.user) });
    expect(query).toHaveBeenLastQueriedWith({
      venus: data.venus,
      sun: data.sun,
      moon: data.moon,
      user: data.user,
      sed_number: data.sedNumber,
      aut_string: data.autString,
      deep_line: data.deepLine,
      createdAt: Date,
      updatedAt: Date,
      method: 'insert',
      table: 'tableName',
    });
  });

  it('when fetch', async () => {
    const model = new ArchiveModel();
    query.mockClear();
    query.mockReturnValueOnce(Promise.resolve([{
      sed_number: data.sedNumber,
      aut_string: data.autString,
      deep_line: data.deepLine,
      archive: JSON.stringify({
        venus: data.venus,
        sun: data.sun,
        moon: data.moon,
        user: data.user,
      }),
    }]));
    const result = await model.fetch();
    expect(result.toJSON()).toEqual(data);
  });

  it('when fetch when archive is undefined', async () => {
    const model = new Model();
    query.mockClear();
    query.mockReturnValueOnce(Promise.resolve([{
      sed_number: data.sedNumber,
      aut_string: data.autString,
      deep_line: data.deepLine,
      venus: data.venus,
      sun: data.sun,
      moon: data.moon,
      user: data.user,
    }]));
    const result = await model.fetch();
    expect(result.toJSON()).toEqual(data);
  });

  it('when where is string', async () => {
    const model = new ArchiveModel();
    query.mockClear();
    await model.where('sedNumber', 5).fetchAll();
    expect(query).toHaveBeenLastQueriedWith({
      method: 'select', table: 'tableName', sed_number: 5,
    });
  });

  it('when where is object', async () => {
    const model = new ArchiveModel();
    query.mockClear();
    await model.where({ sedNumber: 5 }).fetchAll();
    expect(query).toHaveBeenLastQueriedWith({
      method: 'select', table: 'tableName', sed_number: 5,
    });
  });

  it('when fetchAll', async () => {
    const model = new ArchiveModel();
    query.mockClear();
    query.mockReturnValueOnce(Promise.resolve([{
      sed_number: data.sedNumber,
      aut_string: data.autString,
      deep_line: data.deepLine,
      archive: JSON.stringify({
        venus: data.venus,
        sun: data.sun,
        moon: data.moon,
        user: data.user,
      }),
    }]));
    const result = await model.fetchAll();
    expect(result.toJSON()).toEqual([data]);
  });
});

