'use strict';

let path = require('path');
let fs = require('graceful-fs');
let Promise = require("bluebird");
let indexBy = require('lodash.indexby');
let readFile = Promise.promisify(require("fs").readFile);
let parseXml = Promise.promisify(require("xml2js").parseString);

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
    for (let i in options.icons) {
      let str = String(options.icons[i].content).slice(1);
      // console.log(options.icons[i].content)
      console.info(hexToDec(str));
    }

    // for (let data in fontData) {
    //   console.info(fontData[data].content)
    // }
  });
}
