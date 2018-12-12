# simple-marked-sanitizer
A simple sanitizer implementation for [marked](https://github.com/markedjs/marked).  
You can use this as a node module or you can use it from browser directly.

## Install
```
npm install simple-marked-sanitizer
```

## About element(tag name)
It is whitelist based.
If tag name is not in whitelist, it will be escaped.

## About attributes
It is also whitelist based.  
If attribute is not in whitelist, it will be removed.

## How to use

Simple
```
const marked = require("marked");
const SimpleMarkedSanitizer = require("simple-marked-sanitizer");

const sanitizer = new SimpleMarkedSanitizer();

const htmlString = marked(markdownString, {
  sanitize: true,
  sanitizer: sanitizer.getSanitizer()
});
```

With custom whitelist.
```
const marked = require("marked");
const SimpleMarkedSanitizer = require("simple-marked-sanitizer");

const sanitizer = new SimpleMarkedSanitizer().elementWhiteList([ // Define name of tags as an array.
    "a", 
    "sup",
    "sub",
    ...
  ]).attributeWhiteList({ // Define name of attributes for each tags.
    "a": ["href", "target"],
    ...
    "*": [class", "id", "style"] // `*` means these attributes are allowed to all tags.
  });

const htmlString = marked(markdownString, {
  sanitize: true,
  sanitizer: sanitizer.getSanitizer()
});
```

The default whiltelist for elements/attributes are defined in [index.js].  
You can get them as a property of SimpleMarkedSanitizer.

```
const elementWhiteList = SimpleMarkedSanitizer.ELEMENT_WHITELIST;
const attributeWhiteList = SimpleMarkedSanitizer.ATTRIBUTE_WHITELIST;
```

Element whiltelist is based on [marked-sanitizer-github](https://github.com/rhysd/marked-sanitizer-github).  
Very thanks.

Attribute whitelist is my original.

If there are some other safe elements/attributes, I will add them to default.
