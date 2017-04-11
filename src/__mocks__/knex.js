import knex from 'knex';
import { client } from 'jest-mock-knex';

export { client } from 'jest-mock-knex';

export default () => knex({ client });
