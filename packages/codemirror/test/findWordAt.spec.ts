import { findWordAt } from '@lyricistant/codemirror/wordSelection';
import { Text } from '@codemirror/text';
import { EditorSelection } from '@codemirror/state';

describe('Word Selection', () => {
  it('finds words at the beginning of the document', () => {
    const expected = {
      from: 0,
      to: 5,
      word: 'Hello',
    };
    const actual = findWordAt(Text.of(['Hello']), EditorSelection.cursor(0));
    expect(expected).toStrictEqual(actual);
  });

  it('finds words at the beginning of the document at the end of the word', () => {
    const expected = {
      from: 0,
      to: 5,
      word: 'Hello',
    };
    const actual = findWordAt(Text.of(['Hello']), EditorSelection.cursor(5));
    expect(expected).toStrictEqual(actual);
  });

  it('finds words at the beginning of the document in the middle of the word', () => {
    const expected = {
      from: 0,
      to: 5,
      word: 'Hello',
    };
    const actual = findWordAt(Text.of(['Hello']), EditorSelection.cursor(3));
    expect(expected).toStrictEqual(actual);
  });

  it('finds words at the beginning of a line', () => {
    const expected = {
      from: 1,
      to: 6,
      word: 'Hello',
    };
    const actual = findWordAt(
      Text.of(['', 'Hello']),
      EditorSelection.cursor(1)
    );
    expect(expected).toStrictEqual(actual);
  });

  it('finds words at the beginning of a line at the end of the word', () => {
    const expected = {
      from: 1,
      to: 6,
      word: 'Hello',
    };
    const actual = findWordAt(
      Text.of(['', 'Hello']),
      EditorSelection.cursor(6)
    );
    expect(expected).toStrictEqual(actual);
  });

  it('finds words at the beginning of a line in the middle of the word', () => {
    const expected = {
      from: 1,
      to: 6,
      word: 'Hello',
    };
    const actual = findWordAt(
      Text.of(['', 'Hello']),
      EditorSelection.cursor(4)
    );
    expect(expected).toStrictEqual(actual);
  });

  it('finds words prepended with spaces', () => {
    const expected = {
      from: 3,
      to: 8,
      word: 'Hello',
    };
    const actual = findWordAt(
      Text.of(['', '  Hello']),
      EditorSelection.cursor(3)
    );
    expect(expected).toStrictEqual(actual);
  });

  it('finds words prepended with spaces at the end of the word', () => {
    const expected = {
      from: 3,
      to: 8,
      word: 'Hello',
    };
    const actual = findWordAt(
      Text.of(['', '  Hello']),
      EditorSelection.cursor(8)
    );
    expect(expected).toStrictEqual(actual);
  });

  it('finds hyphenated words', () => {
    const expected = {
      from: 2,
      to: 8,
      word: 'do-nut',
    };
    const actual = findWordAt(
      Text.of(['I do-nut wanna.']),
      EditorSelection.cursor(2)
    );
    expect(expected).toStrictEqual(actual);
  });

  it('finds hyphenated words in the middle of the word', () => {
    const expected = {
      from: 2,
      to: 8,
      word: 'do-nut',
    };
    const actual = findWordAt(
      Text.of(['I do-nut wanna.']),
      EditorSelection.cursor(5)
    );
    expect(expected).toStrictEqual(actual);
  });

  it('finds contractions', () => {
    const expected = {
      from: 2,
      to: 7,
      word: "don't",
    };
    const actual = findWordAt(
      Text.of(["I don't wanna."]),
      EditorSelection.cursor(3)
    );
    expect(expected).toStrictEqual(actual);
  });

  it('finds contracts in the middle of the word', () => {
    const expected = {
      from: 2,
      to: 7,
      word: "don't",
    };
    const actual = findWordAt(
      Text.of(["I don't wanna."]),
      EditorSelection.cursor(5)
    );
    expect(expected).toStrictEqual(actual);
  });

  it('finds words in a complicated document', () => {
    const expected = {
      from: 48,
      to: 52,
      word: 'know',
    };
    const actual = findWordAt(
      Text.of([
        'Why you always hit me out of the blue?',
        "When you know I've been in love since like 2002?",
        "And I'm like boo, why you always hit me out of the blue?",
        "When you know I've been crushing since like 2002?",
        'Why you hit me always...always...always...out of the blue?',
      ]),
      EditorSelection.cursor(50)
    );
    expect(expected).toStrictEqual(actual);
  });

  it('finds words from selections', () => {
    const expected = {
      from: 44,
      to: 52,
      word: 'you know',
    };
    const actual = findWordAt(
      Text.of([
        'Why you always hit me out of the blue?',
        "When you know I've been in love since like 2002?",
        "And I'm like boo, why you always hit me out of the blue?",
        "When you know I've been crushing since like 2002?",
        'Why you hit me always...always...always...out of the blue?',
      ]),
      EditorSelection.range(43, 52)
    );
    expect(expected).toStrictEqual(actual);
  });
});
