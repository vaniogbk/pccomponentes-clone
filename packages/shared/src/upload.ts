export const PROOF_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_PROOF_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_PROOF_FILES = 3;

export type ProofMimeType = (typeof PROOF_MIME_TYPES)[number];

export function detectMimeFromBytes(bytes: Uint8Array): ProofMimeType | null {
  if (bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-') {
    return 'application/pdf';
  }

  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) {
    return 'image/png';
  }

  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) {
    return 'image/jpeg';
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

export function sanitizeFileName(name: string): string {
  const safeName = name
    .replace(/\\/g, '/')
    .split('/')
    .pop()
    ?.normalize('NFKC')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

  return safeName || 'justificatif';
}

export interface ProofFileInput {
  name: string;
  declaredMimeType: string;
  bytes: Uint8Array;
}

export function validateProofFile(file: ProofFileInput): string[] {
  const issues: string[] = [];
  const detectedMimeType = detectMimeFromBytes(file.bytes);

  if (file.bytes.byteLength === 0 || file.bytes.byteLength > MAX_PROOF_FILE_BYTES) {
    issues.push('Le justificatif doit peser entre 1 octet et 10 Mo.');
  }

  if (
    !PROOF_MIME_TYPES.includes(file.declaredMimeType as ProofMimeType) ||
    detectedMimeType === null ||
    file.declaredMimeType !== detectedMimeType
  ) {
    issues.push('Le type réel du justificatif ne correspond pas à un format accepté.');
  }

  if (!sanitizeFileName(file.name)) {
    issues.push('Le nom du fichier est invalide.');
  }

  return issues;
}
