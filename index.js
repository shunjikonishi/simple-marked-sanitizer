(function(root) {
'use strict';

const ELEMENT_WHITELIST = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'h7',
  'h8',
  'br',
  'b',
  'i',
  'strong',
  'em',
  'a',
  'pre',
  'code',
  'img',
  'tt',
  'div',
  'ins',
  'del',
  'sup',
  'sub',
  'p',
  'ol',
  'ul',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'blockquote',
  'dl',
  'dt',
  'dd',
  'kbd',
  'q',
  'samp',
  'var',
  'hr',
  'ruby',
  'rt',
  'rp',
  'li',
  'tr',
  'td',
  'th',
  's',
  'strike',
  'summary',
  'details',
];

const ATTRIBUTE_WHITELIST = {
  a: ['href', 'target'],
  img: ['src', 'alt'],
  table: ['border', 'frame', 'summary', 'rules', 'cellpadding', 'cellspacing'],
  th: ['colspan', 'rowspan', 'headers', 'scope'],
  td: ['colspan', 'rowspan', 'headers'],
  '*': [
    'class',
    'id',
    'lang',
    'style',
    'title',
    'name',
    'align',
    'valign',
  ],
};

const OPEN_TAG_REGEX = /^<([a-zA-Z0-9\-]+)\s*(.*)?\/?>$/;
const CLOSE_TAG_REGEX = /^<\/([a-zA-Z0-9\-]+)\s*>$/;

function escape(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const STATE_NAME = 1;
const STATE_EQ = 2;
const STATE_QUOTE = 3;
const STATE_VALUE = 4;
const STATE_REQUIRED_WHITESPACE = 5;

function isNameChar(c) {
  return ('0' <= c && c <= '9') || 
         ('a' <= c && c <= 'z') || 
         ('A' <= c && c <= 'Z') ||
         c === '-' || c === ':' || c === '_';
}

function isWhitespace(c) {
  return c === ' ' || c === '\t' || c === '\n' || c === '\r';
}

function isQuote(c) {
  return c === "'" || c === '"';
}

function parseAttrs(str) {
  if (!str) {
    return [];
  }
  let index = 0;
  let state = STATE_NAME;
  let hasError = false;
  let buf = "";
  let name = "";
  let quote = null;
  const result = [];
  while (!hasError && index < str.length) {
    const c = str.charAt(index++);
    switch (state) {
      case STATE_NAME:
        if (isNameChar(c)) {
          buf += c;
        } else if (isWhitespace(c)) {
          name = buf;
          buf = "";
          state = STATE_EQ;
        } else if (c === '=') {
          name = buf;
          buf = "";
          state = STATE_QUOTE;
        } else {
          hasError = true;
        }
        break;
      case STATE_EQ:
        if (isWhitespace(c)) {
          //Do nothing
        } else if (c === "=") {
          state = STATE_QUOTE
        } else if (isNameChar(c)) {
          result.push({
            name: name
          });
          buf = c;
          state = STATE_NAME;
        } else {
          hasError = true;
        }
        break;
      case STATE_QUOTE:
        if (isWhitespace(c)) {
          //Do nothing
        } else if (isQuote(c))  {
          quote = c;
          state = STATE_VALUE;
        } else {
          hasError = true;
        }
        break;
      case STATE_VALUE:
        if (c === quote) {
          result.push({
            name: name,
            quote: quote,
            value: buf
          });
          buf = "";
          state = STATE_REQUIRED_WHITESPACE;
        } else {
          buf += c;
        }
        break;
      case STATE_REQUIRED_WHITESPACE:
        if (isWhitespace(c)) {
          // Do nothing
        } else if (isNameChar(c)) {
          buf = c;
          state = STATE_NAME;
        } else {
          hasError = true;
        }
        break;
    }
  }
  switch (state) {
    case STATE_NAME:
    case STATE_EQ:
      result.push({
        name: buf || name
      });
      break;
    case STATE_QUOTE:
    case STATE_VALUE:
      hasError = true;
      break;
    case STATE_REQUIRED_WHITESPACE:
      // Do nothing
      break;
  }
  if (hasError) {
    return [];
  }
  return result;
}

class SimpleMarkedSanitizer {

  constructor() {
    this._elementWhiteList = ELEMENT_WHITELIST;
    this._attributeWhiteList = ATTRIBUTE_WHITELIST;
  }

  elementWhiteList(v) {
    this._elementWhiteList = v;
    return this;
  }

  attributeWhiteList(v) {
    this._attributeWhiteList = v;
    return this;
  }

  getSanitizer() {
    return this.sanitize.bind(this);
  }

  sanitize(tag) {
    if (tag.startsWith("</")) {
      return this.sanitizeCloseTag(tag);
    } else {
      return this.sanitizeOpenTag(tag);
    }
  }

  isAllowedTag(tagName) {
    return this._elementWhiteList.indexOf(tagName) === -1;
  }

  isAllowedAttribute(tagName, attrName) {
    const attrDef = this._attributeWhiteList[tagName];
    if (attrDef && attrDef.indexOf(attrName) !== -1) {
      return true;
    }
    const wildcard = this._attributeWhiteList["*"];
    if (wildcard && wildcard.indexOf(attrName) !== -1) {
      return true;
    }
    return false;
  }

  sanitizeOpenTag(tag) {
    const blocks = OPEN_TAG_REGEX.exec(tag);
    if (!blocks) {
      return escape(tag);
    }
    const tagName = blocks[1].toLowerCase();
    const attrBlock = blocks[2];
    if (this.isAllowedTag(tagName)) {
      return escape(tag);
    }
    const attrs = parseAttrs(attrBlock).filter(parsed => {
      if (!this.isAllowedAttribute(tagName, parsed.name)) {
        return false;
      }
      if (parsed.value && parsed.value.startsWith("javascript:")) {
        return false;
      }
      return true;
    });
    let result = "<" + tagName;
    attrs.forEach(v => {
      result += " " + v.name;
      if (v.quote) {
        result += "=" + v.quote + v.value + v.quote;
      }
    });
    if (tag.endsWith("/>")) {
      result += "/>";
    } else {
      result += ">";
    }
    return result;
  }

  sanitizeCloseTag(tag) {
    const blocks = CLOSE_TAG_REGEX.exec(tag);
    if (!blocks) {
      return escape(tag);
    }
    const tagName = blocks[1].toLowerCase();
    if (this.isAllowedTag(tagName)) {
      return escape(tag);
    }
    return tag;
  }
}

SimpleMarkedSanitizer.ELEMENT_WHITELIST = ELEMENT_WHITELIST;
SimpleMarkedSanitizer.ATTRIBUTE_WHITELIST = ATTRIBUTE_WHITELIST;

/// export module
if (typeof module !== 'undefined' && typeof exports === 'object') {
  module.exports = SimpleMarkedSanitizer;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return SimpleMarkedSanitizer; });
} else {
  root.SimpleMarkedSanitizer = SimpleMarkedSanitizer;
}
})(this || (typeof window !== 'undefined' ? window : global));