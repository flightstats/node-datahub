'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var isString = exports.isString = function isString(o) {
  return typeof o === 'string' || Object.toString(o) === '[Object String]';
};

var sanitizeURL = exports.sanitizeURL = function sanitizeURL(url) {
  url = url || '';
  url = url.toLowerCase();
  if (url.indexOf('http://') === -1 && url.indexOf('https://') === -1) {
    url = 'http://' + url;
  }
  return url;
};