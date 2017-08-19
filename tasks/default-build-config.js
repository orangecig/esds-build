'use strict';

/*
    - Clearer variable names
    - Are there good default paths/names that can be used? Convention over configuration
    - Overriding, Extending, Starting from Scratch - 3 distinct use cases
*/


const projectNamespace = 'ds',
        rootPath = '.',
        distPath = `${rootPath}/dist`,
        tokensPath = `${rootPath}/tokens`,
        webroot = `${rootPath}/_site`;

module.exports = {
    rootPath: rootPath,
    scaffoldPath: rootPath, // In an actual project this will always be rootPath, separated here for testing
    distPath: distPath,
    createVersionedDocs: true,
    localEnv: {
        webroot: webroot,
        latestVersionDirectory: `latest`
    },
    markup: {
        buildTaskPrefix: 'markup:build:',
        concatMacrosTaskPrefix: 'markup:concatenate-macros:',
        watchPrefix: 'watch:markup:',
        watchDocsTaskPrefix: 'watch:markup:docs:',
        watchMacrosTaskPrefix: 'watch:markup:macros:',
        tasks: [
            {
                name: 'design-system',
                componentMacros: `${rootPath}/components/**/*.njk`,
                componentMacroOutputPath: `${rootPath}/components`,
                componentMacroFilename: `all_components.njk`,
                componentsReferencedBy: ['doc'],
                docSourceFilePaths: `${rootPath}/docs/**/*.njk`,
                docTemplateImportPaths: [`${rootPath}`],
                docTemplateWatchPaths: [`${rootPath}/docs/**/*.njk`,
                                        `${rootPath}/templates/**/*.njk`], // Don't need to watch components, already monitored
                docOutputPath: `${webroot}/_site/latest`
            }
        ]
    },
    styles: {
        buildTaskPrefix: 'styles:build:', // Will lint, precompile, and postcss
        compileTaskPrefix: 'styles:precompile:',
        postprocessTaskPrefix: 'styles:postprocess:',
        lintTaskPrefix: 'styles:lint:',
        watchTaskPrefix: 'watch:styles:',
        tasks: [
            {
                name: 'design-system',
                compiledFileName: `main.css`,
                outputPath: `${webroot}/latest/styles`,
                compileSourceFiles: [`${rootPath}/styles/*.scss`],
                compileImportPaths: [`${rootPath}/components`, `${rootPath}/tokens`],
                lintOptions: {
                    configFile: `${rootPath}/.sass-lint.yaml`
                },
                lintPaths: [`${rootPath}/styles/**/*.scss`,
                            `${rootPath}/components/**/*.scss`],
                autoprefixerOptions: {
                    browsers: ['last 2 versions'],
                    grid: true
                }
            }
        ]
    },
    tokens: {
        namespace: projectNamespace,
        sourcePath: tokensPath,
        sourceFile: `${tokensPath}/tokens.yaml`, // Support Multiple tokens path?
        outputPath: tokensPath,
        jsonOutputFile: `${tokensPath}/tokens.json`,
        scssOutputFile: `${tokensPath}/tokens.scss`
    }
};
