// Item codes: lab prefix + 4-digit sequence (QUI-0001). Printed on labels, so immutable.

const CODE_RE = /^([A-Z]{2,5})-(\d{4,})$/;

export function formatCode(prefix, seq) {
  return `${prefix.toUpperCase()}-${String(seq).padStart(4, '0')}`;
}

export function isValidCode(code) {
  return CODE_RE.test(code);
}

// Next code for a lab, given the codes already used (any lab).
export function nextCode(prefix, existingCodes) {
  const p = prefix.toUpperCase();
  let max = 0;
  for (const code of existingCodes) {
    const m = CODE_RE.exec(code);
    if (m && m[1] === p) max = Math.max(max, Number(m[2]));
  }
  return formatCode(p, max + 1);
}

// Accepts what a scanner or a person gives us: a full URL (…#/i/QUI-0001),
// a bare code, or a hand-typed code with spaces/lowercase ("qui 7" → QUI-0007).
export function extractCode(text) {
  if (!text) return null;
  const raw = String(text).trim();
  const fromUrl = /#\/i\/([^/?#\s]+)/.exec(raw);
  let candidate;
  try {
    candidate = decodeURIComponent(fromUrl ? fromUrl[1] : raw).toUpperCase();
  } catch {
    return null;
  }
  if (isValidCode(candidate)) return candidate;
  const loose = /^([A-Z]{2,5})[\s\-_]*(\d{1,})$/.exec(candidate);
  return loose ? formatCode(loose[1], Number(loose[2])) : null;
}
