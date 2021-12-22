/*!
 * node-minify
 * Copyright(c) 2011-2021 Rodolphe Stoclin
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
import path from 'path';
import closureCompiler from 'google-closure-compiler';
import { utils } from '@node-minify/utils';

/**
 * Module variables.
 */
const { compiler } = closureCompiler;
const tempFile = path.normalize(__dirname + '/temp-gcc.js');

// the allowed flags, taken from https://github.com/google/closure-compiler
const allowedFlags = [
  'angularPass',
  'applyInputSourceMaps',
  'assumeFunctionWrapper',
  'checksOnly',
  'compilationLevel',
  'createSourceMap',
  'dartPass',
  'defines',
  'env',
  'externs',
  'exportLocalPropertyDefinitions',
  'generateExports',
  'languageIn',
  'languageOut',
  'newTypeInf',
  'outputWrapper',
  'polymerVersion',
  'preserveTypeAnnotations',
  'processCommonJsModules',
  'renamePrefixNamespace',
  'rewritePolyfills',
  'useTypesForOptimization',
  'warningLevel'
];

/**
 * Run Google Closure Compiler.
 *
 * @param {Object} settings
 * @param {String} content
 * @param {Function} callback
 */
/* eslint-disable no-unused-vars */
const minifyGCC = async ({ settings, content, callback, index }) => {
  /* eslint-enable no-unused-vars */
  if (settings.content) {
    utils.writeFile({ file: tempFile, content: settings.content });
  }
  const options = applyOptions({}, settings.options);
  options.js = settings.input || tempFile;

  let stdOutData = '';
  let stdErrData = '';

  const gcc = new compiler(options);
  const compilerProcess = gcc.run();
  compilerProcess.stdout.on('data', data => {
    stdOutData += data;
  });
  compilerProcess.stderr.on('data', data => {
    stdErrData += data;
  });

  const results = await Promise.all([
    new Promise(resolve => compilerProcess.on('close', resolve)),
    new Promise(resolve => compilerProcess.stdout.on('end', resolve)),
    new Promise(resolve => compilerProcess.stderr.on('end', resolve))
  ]);

  if (settings.content) {
    utils.deleteFile(tempFile);
  }

  const exitCode = results[0];

  if (stdErrData.trim().length > 0) {
    console.log('stdErrData', stdErrData);
    if (exitCode > 0 && callback) {
      return callback(stdErrData);
    }
  }

  if (!settings.content) {
    utils.writeFile({ file: settings.output, content: stdOutData, index });
  }

  /**
   * Write GCC sourceMap
   * If the createSourceMap option is passed we'll write the sourceMap file
   * If createSourceMap is a boolean we'll append .map to the settings.output file path
   * otherwise use createSourceMap as the file path.
   */

  // if (settings.options.createSourceMap) {
  //   const sourceMapOutput =
  //     typeof settings.options.createSourceMap === 'boolean'
  //       ? settings.output + '.map'
  //       : settings.options.createSourceMap;
  //   utils.writeFile({ file: sourceMapOutput, content: compilerProcess.sourceMap, index });
  // }

  if (callback) {
    return callback(null, stdOutData);
  }
  return stdOutData;
};

/**
 * Adds any valid options passed in the options parameters to the flags parameter and returns the flags object.
 * @param {Object} flags
 * @param {Object} options
 * @returns {Object} flags
 */
const applyOptions = (flags, options) => {
  if (!options || Object.keys(options).length === 0) {
    return flags;
  }
  Object.keys(options)
    .filter(option => allowedFlags.indexOf(option) > -1)
    .forEach(option => (flags[option] = options[option]));
  return flags;
};

/**
 * Expose `minifyGCC()`.
 */
module.exports = minifyGCC;
