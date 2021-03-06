/* global it */
/* global xit */
/* global describe */
/* global after */
/* global beforeEach */

'use strict';
const assert = require('yeoman-assert'),
      del = require('del'),
      fs = require('fs'),
      mkdirp = require('mkdirp'),
      path = require('path'),
      scaffoldDir = './test/scaffold_test';

// TODO Move this function to a commonly shared place
function recursivelyCheckForFiles(filePaths, done) {
  let allFilesFound = filePaths.every(file => fs.existsSync(file));

  if (allFilesFound) {
    done();
  } else {
    setTimeout(function() {
      recursivelyCheckForFiles(filePaths, done);
    }, 20);
  }
}

module.exports = function(){
    describe('generate:scaffold', function(){
      beforeEach(function() {
        return del(scaffoldDir);
      });

      after(function() {
        return del(scaffoldDir);
      });

      it('should generate a project scaffold with top level directories and basic files', function() {
        const generate = require('../tasks/generate.js'),
              defaultProjectDirectories = [
                'components',
                'data',
                'dist',
                'docs',
                'icons',
                'images',
                'scripts',
                'styles',
                'templates',
                'test',
                'tokens'
            ];
        generate.createTopLevelDirectories(scaffoldDir);
        generate.copyDefaultStarterFiles(scaffoldDir);
        defaultProjectDirectories.forEach(dir => assert.file(`${scaffoldDir}/${dir}`));
        assert.fileContent(`${scaffoldDir}/docs/index.njk`, '<h1>Design System</h1>');
        assert.fileContent(`${scaffoldDir}/.gitignore`, '/_site');
        assert.fileContent(`${scaffoldDir}/.gitignore`, 'node_modules');
        assert.fileContent(`${scaffoldDir}/.gitignore`, '/dist');
        assert.fileContent(`${scaffoldDir}/templates/sink.njk`, `color: darkorange;`);
        assert.fileContent(`${scaffoldDir}/templates/base.njk`, `<link rel="stylesheet" href="/styles/[your-main-stylesheet].css">`);
        assert.fileContent(`${scaffoldDir}/templates/base.njk`, `<script src="/scripts/[your-main-script].js">`);
        assert.noFileContent(`${scaffoldDir}/.npmignore`, '/dist'); // npm package SHOULD contain /dist
      });

      it('should not overwrite any existing directories when the scaffold is generated', function(){
        const docsDir = path.join(scaffoldDir, 'docs'),
              generate = require('../tasks/generate.js'),
              testFile = path.join(docsDir, 'dont-overwrite-me.njk');

        mkdirp.sync(docsDir);
        fs.writeFileSync(testFile, 'Nothing to see here');

        generate.createTopLevelDirectories(scaffoldDir);
        assert.fileContent(path.join(docsDir, 'dont-overwrite-me.njk'), 'Nothing to see here');
      });

      it('should not overwrite any existing files when the scaffold is generated', function(){
        const docsDir = path.join(scaffoldDir, 'docs'),
              generate = require('../tasks/generate.js'),
              testFile = path.join(docsDir, 'index.njk');

        mkdirp.sync(docsDir);
        fs.writeFileSync(testFile, 'Please don\'t overwrite me!');

        generate.copyDefaultStarterFiles(scaffoldDir);
        assert.fileContent(path.join(docsDir, 'index.njk'), 'Please don\'t overwrite me!'); // the default index.njk does not contain this content
        assert.fileContent(`${scaffoldDir}/templates/base.njk`, `<script src="/scripts/[your-main-script].js">`); // It should still write default files that don't already exist
      });
    });

    describe('generate:default-config', function(){
      after(function() {
        return del(scaffoldDir);
      });

      it('should generate a default config', function() {
        const generate = require('../tasks/generate.js');
        generate.copyDefaultConfig(scaffoldDir);
        assert.file(`${scaffoldDir}/esds-build-config.js`);

        const defaultConfig = require(`${__dirname}/scaffold_test/esds-build-config.js`);
        assert(defaultConfig.rootPath.includes('/esds-build'));
        assert(defaultConfig.webroot === '_site');
      });
    });

    describe('generate:new-component', function(){
      after(function() {
        return del(scaffoldDir);
      });

      it('should generate default component files', function(done) {
        const generate = require('../tasks/generate.js');
        generate.generateComponentFiles({componentName: 'Data Table', componentJavascript: true}, scaffoldDir);

          recursivelyCheckForFiles([
            `${scaffoldDir}/components/data_table/data_table.njk`,
            `${scaffoldDir}/components/data_table/data_table.scss`,
            `${scaffoldDir}/components/data_table/data_table.js`,
            `${scaffoldDir}/docs/sink-pages/components/data-tables.njk`
          ], done);
      });
    });
};
