/*!
 * node-minify
 * Copyright(c) 2011-2019 Rodolphe Stoclin
 * MIT Licensed
 */

/**
 * Module dependencies.
 */
import path from 'path';
import glob from 'glob';
import { utils } from '@node-minify/utils';

/**
 * Default settings.
 */
const defaultSettings = {
  sync: false,
  options: {},
  buffer: 1000 * 1024,
  callback: false
};

/**
 * Run setup.
 *
 * @param {Object} inputSettings
 * @return {Object}
 */
const setup = inputSettings => {
  checkMandatories(inputSettings);

  let settings = Object.assign(utils.clone(defaultSettings), inputSettings);
  settings = Object.assign(settings, wildcards(settings.input, settings.publicFolder));
  settings = Object.assign(settings, checkOutput(settings.input, settings.output, settings.publicFolder));
  settings = Object.assign(settings, setPublicFolder(settings.input, settings.publicFolder));

  return settings;
};

/**
 * Check the output path, searching for $1
 * if exist, returns the path remplacing $1 by file name
 *
 * @param {String|Array} input - Path file
 * @param {String} output - Path to the output file
 * @param {String} publicFolder - Path to the public folder
 * @return {Object}
 */
const checkOutput = (input, output, publicFolder) => {
  let reg = new RegExp('\\$1');
  if (reg.test(output)) {
    if (Array.isArray(input)) {
      const outputMin = input.map(file => {
        return utils.setFileNameMin(file, output, publicFolder);
      });
      return { output: outputMin };
    } else {
      return { output: utils.setFileNameMin(input, output, publicFolder) };
    }
  }
};

/**
 * Handle wildcards in a path, get the real path of each files.
 *
 * @param {String|Array} input - Path with wildcards
 * @param {String} publicFolder - Path to the public folder
 * @return {Object}
 */
const wildcards = (input, publicFolder) => {
  // If it's a string
  if (!Array.isArray(input)) {
    return wildcardsString(input, publicFolder);
  }

  return wildcardsArray(input, publicFolder);
};

/**
 * Handle wildcards in a path (string only), get the real path of each files.
 *
 * @param {String} input - Path with wildcards
 * @param {String} publicFolder - Path to the public folder
 * @return {Object}
 */
const wildcardsString = (input, publicFolder) => {
  const output = {};

  if (input.indexOf('*') > -1) {
    output.input = getFilesFromWildcards(input, publicFolder);
  }

  return output;
};

/**
 * Handle wildcards in a path (array only), get the real path of each files.
 *
 * @param {Array} input - Path with wildcards
 * @param {String} publicFolder - Path to the public folder
 * @return {Object}
 */
const wildcardsArray = (input, publicFolder) => {
  let output = {};

  output.input = input;

  // Transform all wildcards to path file
  input.forEach(item => {
    output.input = output.input.concat(getFilesFromWildcards(item, publicFolder));
  });

  // Remove all wildcards from array
  for (let i = 0; i < output.input.length; i++) {
    if (output.input[i].indexOf('*') > -1) {
      output.input.splice(i, 1);

      i--;
    }
  }

  return output;
};

/**
 * Get the real path of each files.
 *
 * @param {String} input - Path with wildcards
 * @param {String} publicFolder - Path to the public folder
 * @return {Object}
 */
const getFilesFromWildcards = (input, publicFolder) => {
  let output = [];

  if (input.indexOf('*') > -1) {
    output = glob.sync((publicFolder || '') + input, null);
  }

  return output;
};

/**
 * Prepend the public folder to each file.
 *
 * @param {String|Array} input - Path to file(s)
 * @param {String} publicFolder - Path to the public folder
 * @return {Object}
 */
const setPublicFolder = (input, publicFolder) => {
  let output = {};

  if (typeof publicFolder !== 'string') {
    return output;
  }

  publicFolder = path.normalize(publicFolder);

  if (Array.isArray(input)) {
    output.input = input.map(item => {
      // Check if publicFolder is already in path
      if (path.normalize(item).indexOf(publicFolder) > -1) {
        return item;
      }
      return path.normalize(publicFolder + item);
    });
    return output;
  }

  input = path.normalize(input);

  // Check if publicFolder is already in path
  if (input.indexOf(publicFolder) > -1) {
    output.input = input;
    return output;
  }

  output.input = path.normalize(publicFolder + input);

  return output;
};

/**
 * Check if some settings are here.
 *
 * @param {Object} settings
 */
const checkMandatories = settings => {
  ['compressor', 'input', 'output'].forEach(item => mandatory(item, settings));
};

/**
 * Check if the setting exist.
 *
 * @param {String} setting
 * @param {Object} settings
 */
const mandatory = (setting, settings) => {
  if (!settings[setting]) {
    throw new Error(setting + ' is mandatory.');
  }
};

/**
 * Expose `setup()`.
 */
export { setup };
