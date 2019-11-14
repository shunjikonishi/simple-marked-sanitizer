(function(root) {
  "use strict";

  var ELEMENT_WHITELIST = [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "h7",
    "h8",
    "br",
    "b",
    "i",
    "strong",
    "em",
    "a",
    "pre",
    "code",
    "img",
    "tt",
    "div",
    "ins",
    "del",
    "sup",
    "sub",
    "p",
    "ol",
    "ul",
    "table",
    "thead",
    "tbody",
    "tfoot",
    "blockquote",
    "dl",
    "dt",
    "dd",
    "kbd",
    "q",
    "samp",
    "var",
    "hr",
    "ruby",
    "rt",
    "rp",
    "li",
    "tr",
    "td",
    "th",
    "s",
    "strike",
    "summary",
    "details",
    "span",
  ];

  var ATTRIBUTE_WHITELIST = {
    a: ["href", "target"],
    img: ["src", "alt"],
    table: ["border", "frame", "summary", "rules", "cellpadding", "cellspacing"],
    th: ["colspan", "rowspan", "headers", "scope"],
    td: ["colspan", "rowspan", "headers"],
    "*": [
      "class",
      "id",
      "lang",
      "style",
      "title",
      "name",
      "align",
      "valign",
    ],
  };

  var OPEN_TAG_REGEX = /^<([a-zA-Z0-9-]+)\s*(.*)?\/?>$/;
  var CLOSE_TAG_REGEX = /^<\/([a-zA-Z0-9-]+)\s*>$/;

  function escape(str) {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  var STATE_NAME = 1;
  var STATE_EQ = 2;
  var STATE_QUOTE = 3;
  var STATE_VALUE = 4;
  var STATE_REQUIRED_WHITESPACE = 5;

  function isNameChar(c) {
    return ("0" <= c && c <= "9") || 
           ("a" <= c && c <= "z") || 
           ("A" <= c && c <= "Z") ||
           c === "-" || c === ":" || c === "_";
  }

  function isWhitespace(c) {
    return c === " " || c === "\t" || c === "\n" || c === "\r";
  }

  function isQuote(c) {
    return c === "'" || c === "\"";
  }

  function isEmptyTag(tagName) {
    const emptyTags = [
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "keygen",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr",
    ];
    return emptyTags.indexOf(tagName) !== -1;
  }

  function parseAttrs(str) {
    if (!str) {
      return [];
    }
    var index = 0;
    var state = STATE_NAME;
    var hasError = false;
    var buf = "";
    var name = "";
    var quote = null;
    var result = [];
    while (!hasError && index < str.length) {
      var c = str.charAt(index++);
      switch (state) {
        case STATE_NAME:
          if (isNameChar(c)) {
            buf += c;
          } else if (isWhitespace(c)) {
            name = buf;
            buf = "";
            state = STATE_EQ;
          } else if (c === "=") {
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
            state = STATE_QUOTE;
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

  function SimpleMarkedSanitizer() {
    this._elementWhiteList = ELEMENT_WHITELIST;
    this._attributeWhiteList = ATTRIBUTE_WHITELIST;
    this._debug = false;
    this._tags = [];
    return this;
  }

  SimpleMarkedSanitizer.prototype.elementWhiteList = function(v) {
    if (!v) {
      return this._elementWhiteList;
    }
    this._elementWhiteList = v;
    return this;
  };

  SimpleMarkedSanitizer.prototype.attributeWhiteList = function(v) {
    if (!v) {
      return this._attributeWhiteList;
    }
    this._attributeWhiteList = v;
    return this;
  };

  SimpleMarkedSanitizer.prototype.debug = function(v) {
    if (typeof(v) === "undefined") {
      return this._debug;
    }
    this._debug = v;
    return this;
  };

  SimpleMarkedSanitizer.prototype.getSanitizer = function() {
    return this.sanitize.bind(this);
  };

  SimpleMarkedSanitizer.prototype.sanitize = function(tag) {
    var result = tag.startsWith("</") ? this.sanitizeCloseTag(tag) : this.sanitizeOpenTag(tag);
    if (this._debug) {
      /* eslint no-console: 0 */
      console.log("[SimpleMarkedSanitizer] " + tag + " -> " + result);
    }
    return result;
  };

  SimpleMarkedSanitizer.prototype.isAllowedTag = function(tagName) {
    return this._elementWhiteList.indexOf(tagName) === -1;
  };

  SimpleMarkedSanitizer.prototype.isAllowedAttribute = function(tagName, attrName) {
    var attrDef = this._attributeWhiteList[tagName];
    if (attrDef && attrDef.indexOf(attrName) !== -1) {
      return true;
    }
    var wildcard = this._attributeWhiteList["*"];
    if (wildcard && wildcard.indexOf(attrName) !== -1) {
      return true;
    }
    return false;
  };

  SimpleMarkedSanitizer.prototype.sanitizeOpenTag = function(tag) {
    var self = this;
    var blocks = OPEN_TAG_REGEX.exec(tag);
    if (!blocks) {
      return escape(tag);
    }
    var tagName = blocks[1].toLowerCase();
    var attrBlock = blocks[2];
    if (attrBlock && tag.endsWith("/>")) {
      attrBlock = attrBlock.substring(0, attrBlock.length - 1); // Remove last `/`
    }
    if (this.isAllowedTag(tagName)) {
      return escape(tag);
    }
    var attrs = parseAttrs(attrBlock).filter(function(parsed){
      if (!self.isAllowedAttribute(tagName, parsed.name)) {
        return false;
      }
      if (parsed.value && parsed.value.trim().startsWith("javascript:")) {
        return false;
      }
      return true;
    });
    var result = "<" + tagName;
    attrs.forEach(function(v) {
      result += " " + v.name;
      if (v.quote) {
        result += "=" + v.quote + v.value + v.quote;
      }
    });
    if (tag.endsWith("/>")) {
      result += "/>";
    } else {
      this.pushTag(tagName);
      result += ">";
    }
    return result;
  };

  SimpleMarkedSanitizer.prototype.sanitizeCloseTag = function(tag) {
    var blocks = CLOSE_TAG_REGEX.exec(tag);
    if (!blocks) {
      return escape(tag);
    }
    var tagName = blocks[1].toLowerCase();
    if (this.isAllowedTag(tagName)) {
      return escape(tag);
    }
    this.popTag(tagName);
    return tag;
  };


  SimpleMarkedSanitizer.prototype.inHtml = function() {
    return this._tags.length > 0;
  }

  SimpleMarkedSanitizer.prototype.pushTag = function(tagName) {
    if (!isEmptyTag(tagName)) {
      this._tags.push(tagName);
    }
  }

  SimpleMarkedSanitizer.prototype.popTag = function(tagName) {
    if (this._tags.length === 0) {
      return;
    }
    if (this._tags[this._tags.length - 1] === tagName) {
      this._tags.pop();
      return;
    }
    let index = this._tags.length - 2;
    while (index >= 0) {
      if (this._tags[index] === tagName) {
        this._tags = this._tass.slice(0, index);
        return;
      }
      index--;
    }
  }

  SimpleMarkedSanitizer.prototype.clearTags = function() {
    this._tags = [];
  }

  SimpleMarkedSanitizer.ELEMENT_WHITELIST = ELEMENT_WHITELIST;
  SimpleMarkedSanitizer.ATTRIBUTE_WHITELIST = ATTRIBUTE_WHITELIST;

  /// export module
  /* eslint no-undef: 0 */
  if (typeof module !== "undefined" && typeof exports === "object") {
    module.exports = SimpleMarkedSanitizer;
  } else if (typeof define === "function" && define.amd) {
    define(function() { return SimpleMarkedSanitizer; });
  } else {
    root.SimpleMarkedSanitizer = SimpleMarkedSanitizer;
  }
})(this || (typeof window !== "undefined" ? window : global));