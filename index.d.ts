export as namespace SimpleMarkedSanitizer;

export = SimpleMarkedSanitizer;

declare class SimpleMarkedSanitizer {
  constructor();
  
  elementWhiteList(): Array<string>;
  elementWhiteList(v: Array<string>): SimpleMarkedSanitizer;

  attributeWhiteList() : { [key: string]: Array<string> }
  attributeWhiteList(v: { [key: string]: Array<string> }): SimpleMarkedSanitizer;

  debug(): boolean;
  debug(v: boolean): SimpleMarkedSanitizer;

  clearTags(): () => void;

  inHtml(): () => boolean;

  getSanitizer(): (str: string) => string;
}

declare namespace SimpleMarkedSanitizer {
  const ELEMENT_WHITELIST: string[];
  const ATTRIBUTE_WHITELIST: { [key: string]: Array<string> };
}
