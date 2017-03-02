import knex from 'knex';

export const query = jest.fn(() => Promise.resolve([]));

const client = class extends knex.Client {
  _query = query;
  acquireConnection = () => Promise.resolve({});
  processResponse = resp => resp;
  releaseConnection = () => Promise.resolve();
};

export default () => knex({ client });
