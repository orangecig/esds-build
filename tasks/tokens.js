'use strict';

const config = require('./config.js'),
        c = config.get(),
        flatten = require('flat'),
        fs = require('fs'),
        path = require('path'),
        gulp = require('gulp'),
        jsBeautify = require('js-beautify'),
        mkdirp = require('mkdirp'),
        yaml = require('yamljs'),
        tokenConfig = c.tokens;

function tokensToJson(sourceFile) {
    let tokens = {},
        parsedTokens;
    try {
        parsedTokens = yaml.load(sourceFile);
        parsedTokens = interpolateYamlVariables(parsedTokens);
        if (parsedTokens !== null && typeof parsedTokens === 'object') {
            tokens = parsedTokens;
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e, `Warning: Could not parse tokens file ${sourceFile} into JSON`);
    }
    return tokens;
}

function interpolateYamlVariables(variables_object) {
    const regex = /!{\*(.*?)}/g;
    let json = JSON.stringify(variables_object);

    json = json.replace(regex, function(match, p1){
        var variable_keys = p1.split('-'),
            value = match,
            sub_variables_object = variables_object;

        variable_keys.forEach(function(key){
            if (sub_variables_object.hasOwnProperty(key)) {
                value = sub_variables_object[key];
                sub_variables_object = value;
            }
        });
        return value;
    });
    return JSON.parse(json);
}

function tokensSourceFileExists(sourceFile) {
    if (fs.existsSync(sourceFile)) {
        return true;
    } else {
        // eslint-disable-next-line no-console
        console.log(`Warning: ${sourceFile} cannot be found, token files not built`);
        return false;
    }
}

function writeTokensJsonFile(tokens) {
    const jsonOutputFilename = path.parse(c.tokensSourceFile).name + '.json',
            jsonOutputFilepath = path.join(c.rootPath, c.tokensPath, jsonOutputFilename),
            tokensSuffix = path.parse(c.tokensSourceFile).name;

    let jsonTokens = {};
        jsonTokens[`${c.codeNamespace.replace(/-/g, '_')}_${tokensSuffix}`] = tokens;

    // JSON tokens
    if (!fs.existsSync(tokenConfig.outputPath)) {
        mkdirp.sync(tokenConfig.outputPath);
    }

    fs.writeFileSync(jsonOutputFilepath, jsBeautify(JSON.stringify(jsonTokens)));
}

function getTokensScssMap(tokens) {
    let tokensSuffix = path.parse(c.tokensSourceFile).name,
        sassMap = `$${tokenConfig.namespace}-${tokensSuffix}: (\n`,
        indentationLevel = 1,
        variablePrefix = `$${tokenConfig.namespace}-`;

    sassMap += generateScssMapSection(tokens, indentationLevel, variablePrefix);
    sassMap += ');\n';
    return sassMap;
}

function getIndentationString(indentationLevel) {
    let indentation = '';
    for (var i = 0; i < indentationLevel; i++) {
        indentation += '    ';
    }

    return indentation;
}

function generateScssMapSection(node, indentationLevel, variablePrefix) {
    let output = '',
        indentation = getIndentationString(indentationLevel);
    for (var key in node) {
        let value = node[key],
            prefix = `${variablePrefix}${key}-`;

        if (typeof value === 'object') {
            value = generateScssMapSection(value, indentationLevel + 1, prefix);
            output += `${indentation}'${key}': (\n`;
            output += value;
            output += `${indentation}),\n`;
        } else {
            output += `${indentation}'${key}': ${variablePrefix}${key},\n`;
        }
    }

    output = output.replace(/,\n$/, '\n');

    return output;
}

function writeTokensScssFile(tokens) {
    const scssOutputFilename = path.parse(c.tokensSourceFile).name + '.scss',
            scssOutputFilepath = path.join(c.rootPath, c.tokensPath, scssOutputFilename),
            scssMap = getTokensScssMap(tokens);
    let flattenedTokens = flatten(tokens, {delimiter: '-'}),
        scss = `// DO NOT EDIT: This file is automatically generated by a build task\n\n`,
        prevVarNameParent = false;

    // SCSS tokens
    for (var varName in flattenedTokens) {
        let value = flattenedTokens[varName],
            varNameParent = varName.substr(0, varName.indexOf('-'));
        if (prevVarNameParent && prevVarNameParent !== varNameParent) {
            scss += '\n';
        }
        prevVarNameParent = varNameParent;

        scss += `$${tokenConfig.namespace}-${varName}: ${value} !default;\n`;
    }
    scss += scssMap + '\n';
    scss += `@function ${tokenConfig.namespace}-token($keys...) {\n` +
                `    $map: $${tokenConfig.namespace}-tokens;\n` +
                '    @each $key in $keys {\n' +
                '        $map: map-get($map, $key);\n' +
                '    }\n' +
                '    @return $map;\n' +
                '}\n';
    fs.writeFileSync(scssOutputFilepath, scss);
}

function convertTokensYaml(sourceFile, done) {
    if (tokensSourceFileExists(sourceFile)) {
        let tokens = tokensToJson(sourceFile);
        tokenConfig.formats.forEach(format => {
            switch (format) {
                case '.json':
                    tokens.namespace = c.codeNamespace;
                    writeTokensJsonFile(tokens);
                    break;
                case '.scss':
                    tokens.namespace = '"' + c.codeNamespace + '"';
                    writeTokensScssFile(tokens);
                    break;
            }
        });
        done();
    } else {
        done();
    }
}

gulp.task(`${c.tokensTaskName}:${c.buildTaskName}:${c.allTaskName}`, function(done){
    convertTokensYaml(tokenConfig.sourceFile, done);
});

gulp.task(`${c.watchTaskName}:${c.tokensTaskName}:${c.allTaskName}`, function(){
    return gulp.watch([tokenConfig.sourceFile], gulp.series(`${c.tokensTaskName}:${c.buildTaskName}:${c.allTaskName}`));
});

module.exports = {
    convertTokensYaml: convertTokensYaml,
    tokensToJson: tokensToJson
};

