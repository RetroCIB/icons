'use strict';

let fs = require('graceful-fs');
let CSSOM = require('cssom');
let humanize = require('humanize-string');

module.exports = function(file, prefix, selector = "^\\.{prefix}([\\w\\d-]+):before") {
  var content = fs.readFileSync(file);
  selector = selector.replace('{prefix}', prefix);

  var icons = {};
  var reg = new RegExp(selector);
  let css = CSSOM.parse(content.toString());

  css.cssRules.forEach(function(rule) {
    let icon = {};
    if(rule.style && rule.style.content) {
        var match = reg.exec(rule.selectorText);
        if(match && match[1]) {
            icon.name = match[1];
            icon.title = match[1];
            icon.content = rule.style.content.replace(/["'](.+)["']/, '$1');

            icons[icon.name] = icon;
        }
    }
  });

  return icons;
}
