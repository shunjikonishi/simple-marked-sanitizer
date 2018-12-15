export as namespace SimpleMarkedSanitizer;

export = SimpleMarkedSanitizer;

declare class SimpleMarkedSanitizer {
  constructor();
  elementWhiteList(v: Array<string>): SimpleMarkedSanitizer;
  attributeWhiteList(v: {
    [key: string]: Array<string>;
  }): SimpleMarkedSanitizer;
  getSanitizer(): (str: string) => string;
}

declare namespace SimpleMarkedSanitizer {
  const ELEMENT_WHITELIST: string[];
  const ATTRIBUTE_WHITELIST: { [key: string]: Array<string> };
}
