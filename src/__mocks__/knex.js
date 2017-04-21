import knex from 'jest-mock-knex';

export { client } from 'jest-mock-knex';

export default () => knex({
  client: 'sqlite',
  connection: { filename: ':memory:' },
  useNullAsDefault: true,
});
