/**
 * Document Validator
 * Validates documents by country and type
 */

/**
 * Normalize document by removing formatting
 */
export function normalizeDocument(document: string): string {
  return document.replace(/[^\dA-Za-z]/g, '');
}

/**
 * Validate CPF (Brazilian Individual Taxpayer Registry)
 * Algorithm: https://www.macoratti.net/alg_cpf.htm
 */
function validateCPF(cpf: string): boolean {
  const cleaned = normalizeDocument(cpf);
  
  // Must have 11 digits
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

/**
 * Validate CNPJ (Brazilian Corporate Taxpayer Registry)
 * Algorithm: https://www.macoratti.net/alg_cnpj.htm
 */
function validateCNPJ(cnpj: string): boolean {
  const cleaned = normalizeDocument(cnpj);
  
  // Must have 14 digits
  if (cleaned.length !== 14) return false;
  
  // Check for known invalid CNPJs (all same digits)
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights1[i];
  }
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cleaned.charAt(12))) return false;
  
  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weights2[i];
  }
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cleaned.charAt(13))) return false;
  
  return true;
}

/**
 * Validate SSN (US Social Security Number)
 * Format: 9 digits
 */
function validateSSN(ssn: string): boolean {
  const cleaned = normalizeDocument(ssn);
  
  // Must have 9 digits
  if (cleaned.length !== 9) return false;
  
  // Check for invalid patterns (all zeros, all same digits, known invalid ranges)
  if (/^(\d)\1+$/.test(cleaned)) return false;
  if (cleaned.startsWith('000')) return false;
  if (cleaned.substring(3, 5) === '00') return false;
  if (cleaned.substring(5) === '0000') return false;
  
  return true;
}

/**
 * Validate EIN (US Employer Identification Number)
 * Format: 9 digits
 */
function validateEIN(ein: string): boolean {
  const cleaned = normalizeDocument(ein);
  
  // Must have 9 digits
  if (cleaned.length !== 9) return false;
  
  // Check for invalid patterns
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  return true;
}

/**
 * Validate NI Number (UK National Insurance Number)
 * Format: 2 letters, 6 digits, 1 letter (e.g., AB123456C)
 */
function validateNINumber(ni: string): boolean {
  const cleaned = normalizeDocument(ni).toUpperCase();
  
  // Must have 9 characters: 2 letters + 6 digits + 1 letter
  if (cleaned.length !== 9) return false;
  
  // Check format: /^[A-Z]{2}\d{6}[A-Z]$/
  if (!/^[A-Z]{2}\d{6}[A-Z]$/.test(cleaned)) return false;
  
  // Check for invalid prefixes
  const invalidPrefixes = ['BG', 'GB', 'NK', 'KN', 'TN', 'NT', 'ZZ'];
  const prefix = cleaned.substring(0, 2);
  if (invalidPrefixes.includes(prefix)) return false;
  
  return true;
}

/**
 * Validate CRN (UK Company Registration Number)
 * Format: 8 digits
 */
function validateCRN(crn: string): boolean {
  const cleaned = normalizeDocument(crn);
  
  // Must have 8 digits
  if (cleaned.length !== 8) return false;
  
  return true;
}

/**
 * Validate document by type and country
 */
export function validateDocument(
  document: string,
  documentType: string,
  countryCode: string
): boolean {
  if (!document || !documentType || !countryCode) {
    return false;
  }

  const normalized = normalizeDocument(document);
  const type = documentType.toLowerCase();
  const country = countryCode.toUpperCase();

  switch (country) {
    case 'BR':
      if (type === 'cpf') {
        return validateCPF(normalized);
      } else if (type === 'cnpj') {
        return validateCNPJ(normalized);
      }
      break;

    case 'US':
      if (type === 'ssn') {
        return validateSSN(normalized);
      } else if (type === 'ein') {
        return validateEIN(normalized);
      }
      break;

    case 'UK':
      if (type === 'ni') {
        return validateNINumber(normalized);
      } else if (type === 'crn') {
        return validateCRN(normalized);
      }
      break;

    case 'OTHER':
      // For other countries/types, just check if document is not empty
      return normalized.length > 0;

    default:
      // Unknown country - accept any non-empty document
      return normalized.length > 0;
  }

  return false;
}

/**
 * Get document type suggestions based on country
 */
export function getDocumentTypesForCountry(countryCode: string): string[] {
  const country = countryCode.toUpperCase();

  switch (country) {
    case 'BR':
      return ['cpf', 'cnpj', 'other'];
    case 'US':
      return ['ssn', 'ein', 'other'];
    case 'UK':
      return ['ni', 'crn', 'other'];
    default:
      return ['other'];
  }
}
