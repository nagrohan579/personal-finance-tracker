/**
 * Utility functions for form handling and validation
 */

/**
 * Handles number input changes, allowing empty values and preventing default "0"
 * @param value - The input value from event.target.value
 * @returns The parsed number or empty string
 */
export function handleNumberInput(value: string): number | string {
  if (value === '' || value === undefined || value === null) {
    return ''
  }
  
  const parsed = parseFloat(value)
  return isNaN(parsed) ? '' : parsed
}

/**
 * Converts form value to number for submission, with validation
 * @param value - The form value (number or string)
 * @param fieldName - Name of the field for error messages
 * @param required - Whether the field is required
 * @returns Object with success boolean and either value or error
 */
export function validateNumberField(
  value: number | string, 
  fieldName: string, 
  required: boolean = true
): { success: true; value: number } | { success: false; error: string } {
  if (value === '' || value === undefined || value === null) {
    if (required) {
      return { success: false, error: `${fieldName} is required` }
    }
    return { success: true, value: 0 }
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return { success: false, error: `${fieldName} must be a valid number` }
  }
  
  if (numValue < 0) {
    return { success: false, error: `${fieldName} cannot be negative` }
  }
  
  return { success: true, value: numValue }
}

/**
 * Validates that a selection field has a value
 * @param value - The selected value
 * @param fieldName - Name of the field for error messages
 * @returns Object with success boolean and error if applicable
 */
export function validateRequiredField(
  value: string, 
  fieldName: string
): { success: true } | { success: false; error: string } {
  if (!value || value.trim() === '') {
    return { success: false, error: `${fieldName} is required` }
  }
  return { success: true }
}
