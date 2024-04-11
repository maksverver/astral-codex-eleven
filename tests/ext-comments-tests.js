'use strict';

let successes = 0;
let failures = 0;

function deepEqual(a, b) {
  if (a === b) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }

  return false;
}

function assertEqual(actual, expected) {
  if (deepEqual(actual, expected)) {
    ++successes;
  } else {
    ++failures;
    console.error(`assertEqual() failed!\n\tExpected: ${expected}\n\tReceived: ${actual}`);
  }
}

function test_splitByUrl() {
  assertEqual(
    splitByUrl('http://example'),
    ['', 'http://example', '']);
  assertEqual(
    splitByUrl('https://example'),
    ['', 'https://example', '']);

  assertEqual(
    splitByUrl("Read http://the-manual.com!"),
    ['Read ', 'http://the-manual.com', '!']);

  assertEqual(
    splitByUrl('foo https://example bar')
    ['foo', 'https://example', 'bar']);

  assertEqual(
    splitByUrl('foo http://example/1 bar http://example/2 baz'),
    ['foo ', 'http://example/1', ' bar ', 'http://example/2', ' baz']);

  // This is a little unfortunate, but OK.
  assertEqual(
    splitByUrl('foohttps://example'),
    ['foo', 'https://example', '']);

  assertEqual(
    splitByUrl('http://example/http://example/'),
    ['', 'http://example/http://example/', '']);

  assertEqual(
    splitByUrl('http://example/,http://example/'),
    ['', 'http://example/,http://example/', '']);

  assertEqual(
    splitByUrl('http://example/, http://example/'),
    ['', 'http://example/', ', ', 'http://example/', '']);

  assertEqual(
    splitByUrl('http://example/,;:"http://example/'),
    ['', 'http://example/,;:"http://example/', '']);

  assertEqual(
    splitByUrl('http://example/,;:" http://example/'),
    ['', 'http://example/', ',;:" ', 'http://example/', '']);

  assertEqual(
    splitByUrl('https://example.com/[bla]?q=(bla)#{bla}&<>'),
    ['', 'https://example.com/[bla]?q=(bla)#{bla}&<>', '']);

  assertEqual(
    splitByUrl('(http://example/)'),
    ['(', 'http://example/', ')']);

  assertEqual(
    splitByUrl('(http://example/(a))'),
    ['(', 'http://example/(a)', ')']);

  assertEqual(
    splitByUrl('[http://example/]'),
    ['[', 'http://example/', ']']);

  assertEqual(
    splitByUrl('[http://example/[a]]'),
    ['[', 'http://example/[a]', ']']);

  assertEqual(
    splitByUrl('{http://example/}'),
    ['{', 'http://example/', '}']);

  assertEqual(
    splitByUrl('{http://example/{a}}'),
    ['{', 'http://example/{a}', '}']);

  assertEqual(
    splitByUrl('HtTp://eXamPlE-123.com/føo'),
    ['', 'HtTp://eXamPlE-123.com/føo', '']);

  // Note Unicode brackets!
  assertEqual(
    splitByUrl('“http://example.com”'),
    ['“', 'http://example.com', '”']);

  // This is unfortunate, but I can't easily determine which Unicode characters
  // represent letters vs punctuation (see above).
  assertEqual(
    splitByUrl('http://example.com/føö'),
    ['', 'http://example.com/f', 'øö']);

  assertEqual(
    splitByUrl('http:bla http/:bla')
    ['http:bla http/:bla']);

  assertEqual(
    splitByUrl('ftp://example.com/'),
    ['ftp://example.com/']);

  assertEqual(
    splitByUrl('foo http://example/bar\\ baz'),
    ['foo ', 'http://example/bar\\ baz', '']);

  assertEqual(
    splitByUrl('http://exa\\mple/'),
    ['', 'http://exa\\mple/', '']);

  assertEqual(
    splitByUrl('http://example/[[]]'),
    ['', 'http://example/[[]', ']']);

  assertEqual(
    splitByUrl('http://example/[[\\]]'),
    ['', 'http://example/[[\\]]', '']);

  assertEqual(
    splitByUrl('http://example/[[]\\]'),
    ['', 'http://example/[[]\\]', '']);

  assertEqual(
    splitByUrl('http://example/\\[\\[\\]\\]'),
    ['', 'http://example/\\[\\[\\]\\]', '']);
}

function test_unescapeUrl() {
  assertEqual(
    unescapeUrl('https://example.com/foo+(bar%20baz)'),
    'https://example.com/foo+(bar%20baz)');

  assertEqual(
    unescapeUrl('https://example.com/foo\\ bar'),
    'https://example.com/foo bar');

  assertEqual(unescapeUrl('\\'), '\\');

  assertEqual(unescapeUrl('\\ \\\\\\(\\)\\+'), ' \\()+');

  // This is unfortunate:
  assertEqual(unescapeUrl('\\0'), '\\0');
  assertEqual(unescapeUrl('\\n'), '\\n');
  assertEqual(unescapeUrl('\\ñ'), 'ñ');
}

function test_splitByEmail() {
  assertEqual(
    splitByEmail('Email me at <First.Last@eXamPle.Com>'),
    ['Email me at <', 'First.Last@eXamPle.Com', '>']);

  assertEqual(
    splitByEmail('(user-1.2_3+bla@456.xn--blabla)'),
    ['(', 'user-1.2_3+bla@456.xn--blabla', ')']);

  // This is unfortunate.
  assertEqual(splitByEmail('bla@bla.blä'), ['', 'bla@bla.bl', 'ä']);

  // Quoting not supported.
  assertEqual(splitByEmail('"First.Last"@domain.com'), ['"First.Last"@domain.com']);

  // Non-ASCII characters not supported.
  assertEqual(splitByEmail('josé@domain.com'), ['josé@domain.com']);

  // IP addresses not supported.
  assertEqual(splitByEmail('user@1.2.3.4'), ['user@1.2.3.4']);

  // This is technically allowed; note that the first '@' is part of the
  // user name. This is why the email address must be url-encoded before
  // adding the "mailto:" prefix.
  assertEqual(splitByEmail('user@example.com?subject=foo&dummy=@x.y'),
      ['', 'user@example.com?subject=foo&dummy=@x.y', '']);

  // No whitespace allowed (and no escaping supported):
  assertEqual(splitByEmail('foo\\ bar@baz.com'),
      ['foo\\ ', 'bar@baz.com', '']);
}

test_splitByUrl();
test_unescapeUrl();
test_splitByEmail();

console.info(`Ran ${successes + failures} tests; ${successes} passed, ${failures} failed.`);
if (failures) {
  console.error(``);
  process.exit(1);
}
