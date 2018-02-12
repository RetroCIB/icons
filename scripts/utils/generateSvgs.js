/* Credit to https://github.com/encharm/Font-Awesome-SVG-PNG MIT */

'use strict';

const pathModule = require('path');
const fs = require('graceful-fs');
const Promise = require("bluebird");
const indexBy = require('lodash.indexby');
const readFile = Promise.promisify(require("fs").readFile);
const parseXml = Promise.promisify(require("xml2js").parseString);
const mkdirp = require("mkdirp");
const SVGO = require('svgo');
const extend = require('extend');
const colors = require('colors');

// getGlyphs
function getAdvWidth(file) {
  return readFile(file)
    .then(function(fontData) {
      return fontData.toString("utf-8");
    })
    .then(parseXml)
    .then(function(parsedXml) {
      let advWidth = parsedXml.svg.defs[0].font[0].$['horiz-adv-x'];
      return advWidth;
    })
}

function getGlyphs(file) {
  let SVG_FILE = require.resolve(file);
  return getAdvWidth(SVG_FILE).then(function(advWidth) {
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
            advWidth: xmlGlyph.$['horiz-adv-x'] || advWidth,
            data: xmlGlyph.$,
            content: xmlGlyph.$.unicode.charCodeAt(0)
          };
        }
      })
      .then(function(fontData) {
        return indexBy(fontData, "content");
      });
  });
}

// generateSvg
function getIconSvg(params, size) {
  let {path, advWidth} = params;
  const result =
  `<svg width="${size}" height="${size}" viewBox="0 0 ${advWidth} ${advWidth}" xmlns="http://www.w3.org/2000/svg">
    <path d="${path}" />
  </svg>`;
  return result;
}

var svgo = new SVGO({
  plugins: [{
    removeViewBox: false
  }]
});

function generateSvg(name, params, size) {
  let svgFolder = pathModule.join(params.destFolder, 'icons');
  mkdirp.sync(svgFolder);

  return new Promise(function(resolve, reject) {
    var outSvg = fs.createWriteStream(pathModule.join(svgFolder, name + '.svg'));
    svgo.optimize(getIconSvg(params, size)).then(function(result) {
      outSvg.end(result.data);
      resolve();
    })
  });
}

function generateIcon(params) {
  var name = params.name;
  var size = params.size;
  console.log('Generating', name);
  var workChain = [];
  if (params.generateSvg) {
    workChain.push(generateSvg(name, params, size));
  }
  return Promise.all(workChain).then(function() {
    return {name: name}
  })
}

function flatten(arr) {
  return arr.reduce(function(a, b) {
    return a.concat(b);
  }, []);
}

function hexToDec(hex) {
  return parseInt(hex, 16);
}

module.exports = function(dest, filename, options) {
  return getGlyphs(`${dest}/${filename}.svg`).then(function(fontData) {
    let icons = new Array();
    for (let i in options.icons) {
      if (options.icons[i].content != undefined) {
        let str = options.icons[i].content.slice(1);
        for (let data in fontData) {
          if (fontData[data] != undefined) {
            if (hexToDec(str) == fontData[data].content) {
              icons.push({
                name: options.icons[i].name,
                advWidth: fontData[data].advWidth,
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
  }).then(function(glyphs) {
    let work = [];

    let iconConfigs = flatten(glyphs.map(function (glyph) {
      return extend(true, {}, {
        name: glyph.name,
        advWidth: glyph.advWidth,
        path: glyph.data.d,
        size: 64,
        generateSvg: true,
        destFolder: dest
      });
    }));
    
    work.push(iconConfigs.map(function(params) {
      generateIcon(params);
    }));

    Promise.all(work).then(function() {
      console.log(colors.green("All done!"));
    });
  });
}
