/**
 * Shared utility for downloading binary blobs returned from authenticated API endpoints.
 * Handles RFC 5987 / Content-Disposition filename parsing and triggers native browser downloads.
 */

export function extractFilenameFromHeader(
  contentDisposition?: string | null,
  fallbackFilename: string = 'download'
): string {
  if (!contentDisposition) return fallbackFilename;

  // RFC 5987 UTF-8 encoded filename (filename*=UTF-8''...)
  const rfc5987Match = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/i);
  if (rfc5987Match && rfc5987Match[1]) {
    try {
      return decodeURIComponent(rfc5987Match[1].trim());
    } catch {
      // fallback
    }
  }

  // Standard quoted filename (filename="...")
  const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1].trim();
  }

  // Unquoted filename (filename=...)
  const unquotedMatch = contentDisposition.match(/filename=([^;\n]+)/i);
  if (unquotedMatch && unquotedMatch[1]) {
    return unquotedMatch[1].trim().replace(/^["']|["']$/g, '');
  }

  return fallbackFilename;
}

export function downloadBlob(
  blob: Blob,
  defaultFilename: string = 'download',
  contentDisposition?: string | null
): void {
  const filename = extractFilenameFromHeader(contentDisposition, defaultFilename);
  const objectUrl = window.URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = objectUrl;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();

  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(objectUrl);
  }, 1000);
}
