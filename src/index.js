/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint no-underscore-dangle: 0 */

import get from 'lodash/get';
import set from 'lodash/set';
import map from 'lodash/map';
import clone from 'lodash/clone';
import merge from 'lodash/merge';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import omit from 'lodash/omit';
import pick from 'lodash/pick';
import mapKeys from 'lodash/mapKeys';
import camelCase from 'lodash/camelCase';
import snakeCase from 'lodash/snakeCase';
import isEmpty from 'lodash/isEmpty';

module.exports = (bookshelf) => {
  bookshelf.Model = class extends bookshelf.Model {

    static softDelete = true;

    static softField = 'deleted_at';

    static archive = [];

    static archiveField = 'archive';

    static formatResponse(response) {
      const { archiveField } = this;

      map(response, (row, index) => {
        if (!isPlainObject(row)) return;

        const reply = mapKeys(row, (value, name) => camelCase(name));
        if (reply[archiveField]) {
          merge(reply, JSON.parse(reply[archiveField]));
          delete reply[archiveField];
        }

        response[index] = reply;
      });
    }

    static table(options) {
      const tableName = get(options, 'tableName', this.tableName);
      const softDelete = get(options, 'softDelete', this.softDelete);
      const softField = get(options, 'softField', this.softField);
      const table = bookshelf.knex.table(tableName);

      if (softDelete) {
        table.whereNull(`${tableName}.${softField}`);
      }

      table.on('query-response', this.formatResponse.bind(this));

      return table;
    }

    static collection(...args) {
      merge(
        this.prototype,
        pick(this, ['tableName', 'hasTimestamps', 'softDelete', 'softField', 'archive', 'archiveField']),
      );

      return super.collection.apply(this, args);
    }

    constructor(...args) {
      super(...args);

      merge(this, pick(
        this.constructor,
        ['tableName', 'hasTimestamps', 'softDelete', 'softField', 'archive', 'archiveField'],
      ));

      this.on('fetching', this.mountFetch);
      this.on('fetching:collection', this.mountFetch);
    }

    set(key, val, options) {
      const attrs = isString(key) ? set({}, key, val) : key;

      return super.set(
        mapKeys(attrs, (value, name) => camelCase(name)),
        (isPlainObject(val) ? val : options) || {},
      );
    }

    format(attrs) {
      const data = mapKeys(attrs, (value, name) => snakeCase(name));
      
      if (this.archive.length) {
        return set(
          omit(data, this.archive),
          this.archiveField,
          JSON.stringify(pick(data, this.archive)),
        );
      }

      return data;
    }

    mountFetch = (model, attrs, options) => {
      if (!options.isEager || options.parentResponse) {
        const softDelete = get(options, 'softDelete', this.softDelete);

        if (softDelete) {
          options.query.whereNull(`${get(this, 'tableName')}.${this.softField}`);
        }

        options.query.on('query-response', this.constructor.formatResponse.bind(this.constructor));
      }
    }

    where(key, ...args) {
      return this.query(
        'where',
        isPlainObject(key) ? mapKeys(key, (value, name) => snakeCase(name)) : snakeCase(key),
        ...args,
      );
    }

    async destroy(args) {
      const options = args ? clone(args) : {};
      const sync = this.sync(options);
      options.query = sync.query;

      await this.triggerThen('destroying', this, options);

      const softDelete = get(options, 'softDelete', this.softDelete);

      let reply;
      if (softDelete) {
        merge(options, {
          method: 'update',
          patch: true,
          softDelete: true,
        });
        const attrs = set({}, this.softField, new Date());
        reply = await sync.update(attrs);
        merge(this.attributes, attrs);
      } else {
        reply = await sync.del();
      }

      if (isEmpty(reply) && options.require) {
        throw new bookshelf.Model.NoRowsDeletedError('No Rows Deleted');
      }

      if (softDelete) {
        options.previousAttributes = this._previousAttributes;
      } else {
        this.clear();
      }

      await this.triggerThen('destroyed', this, reply, options);

      this._reset();

      return this;
    }
  };
};
