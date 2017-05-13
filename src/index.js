/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint no-underscore-dangle: 0 */

import _ from 'lodash';

const defaultConfigs = {
  softDelete: true,
  softField: 'deleted_at',
  archive: [],
  archiveField: 'archive',
};

function mountSoftDelete(model, attrs, options) {
  const softDelete = _.get(options, 'softDelete', this.softDelete);

  if (softDelete) {
    options.query.whereNull(`${_.get(this, 'tableName')}.${this.softField}`);
  }
}

function buildQuery(builder) {
  const data = builder.toSQL();
  _.set(data, 'sql', _.replace(data.sql, /[\w\d]+/gi, _.snakeCase));
  builder.toSQL = () => data;
}

function buildResponse(response, archiveField) {
  _.forEach(response, (row, index) => {
    if (!_.isObject(row)) return;

    const data = _.mapKeys(row, (value, name) => _.camelCase(name));

    if (archiveField && data[archiveField]) {
      const archive = data[archiveField];
      _.assign(data, _.isObject(archive) ? archive : JSON.parse(archive));
      delete data[archiveField];
    }

    response[index] = data;
  });
}

function mountArchive(builder, archiveField) {
  builder.on('start', buildQuery);
  builder.on('query-response', response => buildResponse(response, archiveField));
}

module.exports = (bookshelf) => {
  const modelPrototype = bookshelf.Model.prototype;
  const collectionPrototype = bookshelf.Collection.prototype;

  bookshelf.Collection = bookshelf.Collection.extend({
    initialize: function initialize(...args) {
      collectionPrototype.initialize(...args);

      _.defaults(this.model.prototype, defaultConfigs);
      _.assign(this.model.prototype, _.pick(
        this.model,
        ['tableName', 'hasTimestamps', 'softDelete', 'softField', 'archive', 'archiveField'],
      ));
    },

    query: function query(...args) {
      const builder = collectionPrototype.query.apply(this, args);
      const { archive, archiveField } = this.model.prototype;
      if (args.length < 1) mountArchive(builder, _.size(archive) && archiveField);
      return builder;
    },
  });

  bookshelf.Model = bookshelf.Model.extend({
    initialize: function initialize(...args) {
      modelPrototype.initialize(...args);

      _.defaults(this, defaultConfigs);
      _.assign(this, _.pick(
        this.constructor,
        ['tableName', 'hasTimestamps', 'softDelete', 'softField', 'archive', 'archiveField'],
      ));

      this.on('fetching', mountSoftDelete.bind(this));
      this.on('fetching:collection', mountSoftDelete.bind(this));
      this.on('counting', mountSoftDelete.bind(this));
    },

    fetch: function fetch(options) {
      const archive = _.get(this, 'archive', []);

      if (_.size(archive)) {
        return this._doFetch(_.omit(this.attributes, archive), options);
      }

      return this._doFetch(this.attributes, options);
    },

    format: function format(attributes) {
      const archive = _.get(this, 'archive', []);

      if (_.size(archive)) {
        const data = _.pick(attributes, archive);
        if (_.size(data)) {
          attributes[this.archiveField] = data;
          _.forEach(data, (value, key) => delete attributes[key]);
        }
      }

      return _.mapValues(
        attributes,
        value => (_.isPlainObject(value) ? JSON.stringify(value) : value),
      );
    },

    query: function query(...args) {
      const builder = modelPrototype.query.apply(this, args);
      const { archive, archiveField } = this;
      if (args.length < 1) mountArchive(builder, _.size(archive) && archiveField);
      return builder;
    },

    destroy: async function destroy(args) {
      const options = args ? _.clone(args) : {};
      const sync = this.sync(options);
      options.query = sync.query;

      await this.triggerThen('destroying', this, options);

      const softDelete = _.get(options, 'softDelete', this.softDelete);

      let reply;
      if (softDelete) {
        _.merge(options, {
          method: 'update',
          patch: true,
          softDelete: true,
        });
        const attrs = _.set({}, this.softField, new Date());
        reply = await sync.update(attrs);
        _.merge(this.attributes, attrs);
      } else {
        reply = await sync.del();
      }

      if (_.isEmpty(reply) && options.require) {
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
    },
  });
};
