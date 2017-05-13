
exports.up = knex => (
  Promise.all([
    knex.schema.createTableIfNotExists('class_table', (table) => {
      table.bigIncrements();
      table.bigInteger('max_size').unsigned();
      table.string('text');
      table.string('more');
    }),
    knex.schema.createTableIfNotExists('static_table', (table) => {
      table.bigIncrements();
      table.bigInteger('max_size').unsigned();
      table.string('text');
      table.json('detail');
      table.dateTime('disabled');
      table.timestamps();
    }),
    knex.schema.createTableIfNotExists('extend_table', (table) => {
      table.bigIncrements();
      table.bigInteger('max_size').unsigned();
      table.string('text');
      table.string('more');
    }),
    knex.schema.createTableIfNotExists('proto_table', (table) => {
      table.bigIncrements();
      table.bigInteger('max_size').unsigned();
      table.string('text');
      table.json('archive');
      table.dateTime('closed');
      table.timestamps();
    }),
    knex.schema.createTableIfNotExists('default_table', (table) => {
      table.bigIncrements();
      table.bigInteger('max_size').unsigned();
      table.string('text');
      table.string('more');
      table.dateTime('deleted_at');
    }),
  ])
);

exports.down = knex => (
  Promise.all([
    knex.schema.dropTable('class_table'),
    knex.schema.dropTable('static_table'),
    knex.schema.dropTable('extend_table'),
    knex.schema.dropTable('proto_table'),
    knex.schema.dropTable('default_table'),
  ])
);
