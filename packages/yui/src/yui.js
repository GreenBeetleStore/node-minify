/*!
 * node-minify
 * Copyright(c) 2011-2022 Rodolphe Stoclin
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

import path from 'path';
import { utils } from '@node-minify/utils';
import { runCommandLine } from '@node-minify/run';

/**
 * Module variables.
 */
const binYui = path.normalize(__dirname + '/binaries/yuicompressor-2.4.7.jar');

/**
 * Run YUI Compressor.
 *
 * @param {Object} settings
 * @param {String} content
 * @param {Function} callback
 */

const minifyYUI = ({ settings, content, callback, index }) => {
  return runCommandLine({
    args: yuiCommand(settings.type, settings.options),
    data: content,
    settings,
    callback: (err, content) => {
      if (err) {
        if (callback) {
          return callback(err);
        } else {
          throw err;
        }
      }
      if (!settings.content) {
        utils.writeFile({ file: settings.output, content, index });
      }
      if (callback) {
        return callback(null, content);
      }
      return content;
    }
  });
};

/**
 * YUI Compressor CSS command line.
 */

const yuiCommand = (type = 'js', options) => {
  return ['-jar', '-Xss2048k', binYui, '--type', type].concat(utils.buildArgs(options || {}));
};

/**
 * Expose `minifyYUI()`.
 */

module.exports = minifyYUI;
