export default class SimpleMarkedSanitizer {
  construct(): SimpleMarkedSanitizer;

  elementWhiteList(list: string[]): SimpleMarkedSanitizer;
  attributeWhiteList(list: {[key: string]: string[]}): SimpleMarkedSanitizer;
  getSanitizer(): (str: string) => string;
}
