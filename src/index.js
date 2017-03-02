/* eslint no-param-reassign: ["error", { "props": false }] */

import _ from 'lodash';

module.exports = function bookshelfArchive(bookshelf) {
  bookshelf.Model = bookshelf.Model.extend({
    parse: function parse({ archive, ...attr }) {
      const data = _.mapKeys(attr, (value, key) => _.camelCase(key));
      const archiveData = archive ? JSON.parse(archive) : {};
      return { ...data, ...archiveData };
    },
    format: function format(attr) {
      const data = {};
      const archive = {};
      if (_.size(this.archive)) {
        _.forEach(attr, (value, name) => {
          const target = _.includes(this.archive, name) ? archive : data;
          target[name] = value;
        });

        if (_.size(archive)) data.archive = JSON.stringify(archive);
      }
      return _.mapKeys(data, (value, key) => _.snakeCase(key));
    },
    where: function where(condition, ...args) {
      return this.query(
        'where',
        _.isPlainObject(condition) ?
          _.mapKeys(condition, (value, key) => _.snakeCase(key))
        :
          _.snakeCase(condition),
        ...args,
      );
    },
  });
};
