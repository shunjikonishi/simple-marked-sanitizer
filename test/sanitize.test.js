const assert = require("chai").assert;
const marked = require("marked");

const Sanitizer = require("../index.js");

const DEFAULT_SANITIZER = new Sanitizer();

function apply(input, sanitizer) {
  return marked(input, {
    sanitize: true,
    sanitizer: (sanitizer || DEFAULT_SANITIZER).getSanitizer()
  }).trim();
}
describe("SimpleMarkedSanitizer", function() {
  it("Super simple case", () => {
    const input  = "<h1>test</h1>";
    const output = "<p><h1>test</h1></p>";
    const result = apply(input);
    assert.equal(result, output);
  });

  it("with an atter with sing quote", () => {
    const input  = "<h1 id='hoge'>test</h1>";
    const output = "<p><h1 id='hoge'>test</h1></p>";
    const result = apply(input);
    assert.equal(result, output);
  });

  it("with an atter with double quote", () => {
    const input  = '<h1 id="hoge" >test</h1>';
    const output = '<p><h1 id="hoge">test</h1></p>';
    const result = apply(input);
    assert.equal(result, output);
  });

  it("with an atter only", () => {
    const input  = '<h1 id>test</h1>';
    const output = '<p><h1 id>test</h1></p>';
    const result = apply(input);
    assert.equal(result, output);
  });

  it("with multiple attrs", () => {
    const input  = '<h1 id="hoge"   class="fuga" style >test</h1>';
    const output = '<p><h1 id="hoge" class="fuga" style>test</h1></p>';
    const result = apply(input);
    assert.equal(result, output);
  });

  it("with multiple attrs with space", () => {
    const input  = '<h1 id = "hoge"   style    class = "fuga" >test</h1>';
    const output = '<p><h1 id="hoge" style class="fuga">test</h1></p>';
    const result = apply(input);
    assert.equal(result, output);
  });

  it("with attr which has character '>'", () => {
    const input  = '<h1 id="ho>ge"   class="fuga" style >test</h1>';
    const output = '<p><h1 id="ho>ge" class="fuga" style>test</h1></p>';
    const result = apply(input);
    assert.equal(result, output);
  });

  it("with not allowed tagname '>'", () => {
    const input  = '<h10 id="hoge"   class="fuga" style >test</h10>';
    const output = '<p>&lt;h10 id="hoge"   class="fuga" style &gt;test&lt;/h10&gt;</p>';
    const result = apply(input);
    assert.equal(result, output);
  });

  it("with not allowed attr", () => {
    const input  = '<h1 id="hoge"   class="fuga" hoge="fuga" style >test</h1>';
    const output = '<p><h1 id="hoge" class="fuga" style>test</h1></p>';
    const result = apply(input);
    assert.equal(result, output);
  });

  it("with invalid attr def", () => {
    const input  = '<h1 id=hoge   class="fuga" hoge="fuga" style >test</h1>';
    const output = '<p><h1>test</h1></p>';
    const result = apply(input);
    assert.equal(result, output);
  });
});