/* eslint no-param-reassign: ["error", { "props": false }] */

import _ from 'lodash';
import knex, { client } from 'knex';
import bookshelf from 'bookshelf';
import archive from '../';

const db = bookshelf(knex());
db.plugin(archive);

class ArchiveModel extends db.Model {
  static tableName = 'table';
  static hasTimestamps = true;
  static softDelete = false;
  static archive = ['venus', 'sun', 'user'];
}

const Model = db.Model.extend({
  tableName: 'table',
  hasTimestamps: true,
});

const id = 12;

const data = {
  sed: 10,
  line: 'wow!! happy',
  venus: 99,
  sun: 'new time a day',
  user: { nickname: 'yutin', sex: true },
};

const starBox = 'big';

describe('bookshelf-archive help', () => {
  it('when select', async () => {
    const archiveModel = new ArchiveModel();

    client.mockClear();
    client.mockReturnValueOnce([{
      ..._.omit(data, ArchiveModel.archive),
      archive: JSON.stringify(_.pick(data, ArchiveModel.archive)),
      star_box: starBox,
    }]);
    const reply1 = await archiveModel.fetch();
    expect(reply1.toJSON()).toEqual({ ...data, starBox });


    client.mockClear();
    client.mockReturnValueOnce([{
      ..._.omit(data, ArchiveModel.archive),
      archive: JSON.stringify(_.pick(data, ArchiveModel.archive)),
      star_box: starBox,
    }]);
    const reply2 = await ArchiveModel.table().select('*');
    expect(reply2).toEqual([{ ...data, starBox }]);
  });

  it('when insert', async () => {
    const archiveModel = new ArchiveModel();
    const model = new Model();

    client.mockClear();
    await archiveModel.save({ ...data, starBox });
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenLastCalledWith(
      expect.objectContaining({
        archive: JSON.stringify(_.pick(data, ArchiveModel.archive)),
        star_box: starBox,
      }),
    );

    client.mockClear();
    await model.save({ ...data, user: JSON.stringify(data.user), starBox });
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...data,
        user: JSON.stringify(data.user),
        star_box: starBox,
      }),
    );
  });

  it('when insert and archive is null', async () => {
    const archiveModel = new ArchiveModel();
    const model = new Model();

    client.mockClear();
    await archiveModel.save({ ..._.omit(data, ArchiveModel.archive) });
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenLastCalledWith(expect.objectContaining({ archive: '{}' }));

    client.mockClear();
    await model.save({ ...data, user: JSON.stringify(data.user) });
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
  });

  it('when update', async () => {
    const archiveModel = new ArchiveModel({ id });
    const model = new Model({ id });

    client.mockClear();
    await archiveModel.save({ ...data, starBox });
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenLastCalledWith(
      expect.objectContaining({
        archive: JSON.stringify(_.pick(data, ArchiveModel.archive)),
        star_box: starBox,
      }),
    );

    client.mockClear();
    await model.save({ ...data, user: JSON.stringify(data.user), starBox });
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenLastCalledWith(
      expect.objectContaining({
        ...data,
        user: JSON.stringify(data.user),
        star_box: starBox,
      }),
    );
  });

  it('when destroy', async () => {
    const archiveModel = new ArchiveModel({ id });
    const model = new Model({ id });
    const whereModel = new Model().where({ starBox });

    client.mockClear();
    await archiveModel.destroy();
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'delete' }));

    client.mockClear();
    await model.destroy();
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenLastCalledWith(expect.objectContaining({ method: 'update' }));

    client.mockClear();
    await whereModel.destroy();
    expect(client).toMatchSnapshot();
    expect(client).toHaveBeenCalledTimes(1);
    expect(client).toHaveBeenLastCalledWith(expect.objectContaining({ star_box: starBox }));
  });
});

