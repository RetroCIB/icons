/* Credit to https://github.com/encharm/Font-Awesome-SVG-PNG MIT */

'use strict';

let path = require('path');
let fs = require('graceful-fs');
let Promise = require("bluebird");
let indexBy = require('lodash.indexby');
let readFile = Promise.promisify(require("fs").readFile);
let parseXml = Promise.promisify(require("xml2js").parseString);
let mkdirp = require("mkdirp");
let SVGO = require('svgo');
let extend = require('extend');

// getGlyphs
function hexToDec(hex) {
  return parseInt(hex, 16);
}

function getGlyphs(file) {
  let SVG_FILE = require.resolve(file);

  return readFile(SVG_FILE)
    .then(function(fontData) {
      return fontData.toString("utf-8");
    })
    .then(parseXml)
    .then(function(parsedXml) {
      return parsedXml.svg.defs[0].font[0].glyph;
    })
    .map(function(xmlGlyph) {
      if (xmlGlyph.$.unicode) {
        return {
          data: xmlGlyph.$,
          content: xmlGlyph.$.unicode.charCodeAt(0)
        };
      }
    })
    .then(function(fontData) {
      return indexBy(fontData, "content");
    });
}

module.exports = function(dest, filename, options) {
  getGlyphs(`${dest}/${filename}.svg`).then(function(fontData) {
    // console.log(options.icons);
  	// console.info(data);
    let icons = new Array();
    for (let i in options.icons) {
      if (options.icons[i].content != undefined) {
        let str = options.icons[i].content.slice(1);
        for (let data in fontData) {
          if (fontData[data] != undefined) {
            if (hexToDec(str) == fontData[data].content) {
              icons.push({
                name: options.icons[i].name,
                content: options.icons[i].content,
                title: options.icons[i].title,
                data: fontData[data].data
              })
            }
          }
        }
      }
    }
    return icons;
  });
}
