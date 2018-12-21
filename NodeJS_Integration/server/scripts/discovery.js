'use strict';

const loopback = require('loopback');
const promisify = require('util').promisify;
const fs = require('fs');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdirp = promisify(require('mkdirp'));

const DATASOURCE_NAME = 'mysql_db';
const dataSourceConfig = require('../datasources.json');
const db = new loopback.DataSource(dataSourceConfig[DATASOURCE_NAME]);

async function discover() {
  // It's important to pass the same "options" object to all calls
  // of dataSource.discoverSchemas(), it allows the method to cache
  // discovered related models
  const options = {relations: true};

  // Discover models and relations
  // TODO : Remplir avec le nom de vos tables
  const tablesToDiscover = ['artiste', 'cassette', 'client', 'emprunt', 'film', 'interprete', 'pays', 'realisateur'];

  // Create model definition files
  await mkdirp('common/models');

  const schema = {};
  tablesToDiscover.forEach(async table => {
	schema[table] = await db.discoverSchemas(table, options);

	await writeFile(
		'common/models/' + table + '.json',
		JSON.stringify(schema[table][dataSourceConfig[DATASOURCE_NAME].database + '.' + table], null, 2)
	);
  });

  // Expose models via REST API
  const configJson = await readFile('server/model-config.json', 'utf-8');
  console.log('MODEL CONFIGURATION SET-UP...');

  const config = JSON.parse(configJson);

  tablesToDiscover.forEach(async table => {
	config[table] = {dataSource: DATASOURCE_NAME, public: true};
  });

  await writeFile(
	  'server/model-config.json',
	  JSON.stringify(config, null, 2)
  );
}

// Main script execution
discover().then(
	success => {
	  console.log('Models succesfully created !');
	  process.exit();
	},
	error => {
	  console.error('UNHANDLED ERROR:\n', error);
	  process.exit(1);
	}
);
