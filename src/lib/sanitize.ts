/**
 * Input Sanitization Utility for Homebite
 * Prevents XSS attacks and cleans user inputs
 */

/**
 * Strip HTML tags from a string (server-safe, no DOM dependency)
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Sanitize a general text input (name, address, etc.)
 * - Removes HTML tags
 * - Trims whitespace
 * - Limits length
 */
export function sanitizeText(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== 'string') return '';
  return stripHtml(input).substring(0, maxLength).trim();
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const cleaned = input.trim().toLowerCase();
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(cleaned) ? cleaned : '';
}

/**
 * Sanitize phone number (Indonesian format)
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Keep only digits and leading +
  return input.replace(/[^\d+]/g, '').substring(0, 15);
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: any, min: number = 0, max: number = Infinity): number {
  const num = Number(input);
  if (isNaN(num)) return min;
  return Math.max(min, Math.min(max, num));
}

/**
 * Sanitize postal code (Indonesian: 5 digits)
 */
export function sanitizePostalCode(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/\D/g, '').substring(0, 5);
}

/**
 * Validate and sanitize file upload
 * Returns null if file is invalid
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const {
    maxSizeMB = 5,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  } = options;

  // Check file size
  if (file.size > maxSizeMB * 1024 * 1024) {
    return { valid: false, error: `Ukuran file maksimal ${maxSizeMB}MB` };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `Tipe file tidak didukung: ${file.type}` };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExt) {
    return { valid: false, error: `Extension file tidak valid` };
  }

  return { valid: true };
}

/**
 * Sanitize an order/checkout payload
 */
export function sanitizeOrderPayload(payload: any): {
  valid: boolean;
  error?: string;
  data?: any;
} {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Data pesanan tidak valid' };
  }

  const { items, alamat } = payload;

  // Validate items array
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return { valid: false, error: 'Item pesanan tidak valid' };
  }

  // Sanitize each item
  const sanitizedItems = items.map((item: any) => ({
    id: sanitizeText(String(item.id || ''), 100),
    nama: sanitizeText(String(item.nama || ''), 200),
    harga: sanitizeNumber(item.harga, 0, 100_000_000),
    jumlah: sanitizeNumber(item.jumlah, 1, 999),
  }));

  // Validate items have required fields
  for (const item of sanitizedItems) {
    if (!item.id || item.harga <= 0 || item.jumlah <= 0) {
      return { valid: false, error: 'Data item pesanan tidak lengkap' };
    }
  }

  // Sanitize alamat
  if (!alamat || typeof alamat !== 'object') {
    return { valid: false, error: 'Alamat pengiriman tidak valid' };
  }

  const sanitizedAlamat = {
    id: sanitizeText(String(alamat.id || ''), 100),
    alamat: sanitizeText(String(alamat.alamat || ''), 500),
    kota: sanitizeText(String(alamat.kota || ''), 100),
    provinsi: sanitizeText(String(alamat.provinsi || ''), 100),
    kode_pos: sanitizePostalCode(String(alamat.kode_pos || '')),
  };

  if (!sanitizedAlamat.id || !sanitizedAlamat.alamat || !sanitizedAlamat.kota || !sanitizedAlamat.provinsi) {
    return { valid: false, error: 'Data alamat tidak lengkap' };
  }

  return {
    valid: true,
    data: {
      items: sanitizedItems,
      alamat: sanitizedAlamat,
    },
  };
}
