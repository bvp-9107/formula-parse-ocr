function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function latexToOmml(latex: string, isDisplay: boolean = true): string {
  let cleaned = latex.trim();
  let ommlContent = cleaned;

  const wrapOmml = (innerXml: string) => {
    if (isDisplay) {
      return `<m:oMathPara xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:oMath>${innerXml}</m:oMath></m:oMathPara>`;
    }
    return `<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">${innerXml}</m:oMath>`;
  };

  const fracRegex = /\\frac\{([^}]+)\}\{([^}]+)\}/g;
  ommlContent = ommlContent.replace(fracRegex, (_match, num, den) => {
    return `<m:f><m:num><m:r><m:t>${escapeXml(num)}</m:t></m:r></m:num><m:den><m:r><m:t>${escapeXml(den)}</m:t></m:r></m:den></m:f>`;
  });

  const supRegex = /([a-zA-Z0-9]+)\^\{?([^}]+)\}?/g;
  ommlContent = ommlContent.replace(supRegex, (_match, base, exp) => {
    return `<m:sSup><m:e><m:r><m:t>${escapeXml(base)}</m:t></m:r></m:e><m:sup><m:r><m:t>${escapeXml(exp)}</m:t></m:r></m:sup></m:sSup>`;
  });

  const subRegex = /([a-zA-Z0-9]+)_\{?([^}]+)\}?/g;
  ommlContent = ommlContent.replace(subRegex, (_match, base, sub) => {
    return `<m:sSub><m:e><m:r><m:t>${escapeXml(base)}</m:t></m:r></m:e><m:sub><m:r><m:t>${escapeXml(sub)}</m:t></m:r></m:sub></m:sSub>`;
  });

  if (!ommlContent.includes('<m:')) {
    ommlContent = `<m:r><m:t>${escapeXml(cleaned)}</m:t></m:r>`;
  }

  return wrapOmml(ommlContent);
}
