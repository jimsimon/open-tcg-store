import { describe, it, expect } from 'vitest';
import { escapeHtml } from './html-escape';

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
  });

  it('should escape double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('should escape less-than signs', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
  });

  it('should escape greater-than signs', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  it('should escape all special characters in a mixed string', () => {
    expect(escapeHtml('<div class="x" data-name=\'y\'>&</div>')).toBe(
      '&lt;div class=&quot;x&quot; data-name=&#39;y&#39;&gt;&amp;&lt;/div&gt;',
    );
  });

  it('should return empty string unchanged', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should return strings with no special characters unchanged', () => {
    expect(escapeHtml('hello world 123')).toBe('hello world 123');
  });

  it('should handle multiple consecutive special characters', () => {
    expect(escapeHtml('<<>>')).toBe('&lt;&lt;&gt;&gt;');
  });

  it('should handle already-escaped entities by double-escaping', () => {
    expect(escapeHtml('&amp;')).toBe('&amp;amp;');
  });
});
