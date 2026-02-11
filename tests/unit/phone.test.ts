import { describe, it, expect } from 'vitest'
import {
  formatPhoneForWhatsApp,
  formatPhoneDisplay,
  isValidBrazilianPhone,
} from '@/lib/utils/phone'

describe('Phone Utils', () => {
  describe('formatPhoneForWhatsApp', () => {
    it('should add country code if missing', () => {
      expect(formatPhoneForWhatsApp('11999887766')).toBe('+5511999887766')
    })

    it('should not duplicate country code', () => {
      expect(formatPhoneForWhatsApp('5511999887766')).toBe('+5511999887766')
    })

    it('should handle formatted input', () => {
      expect(formatPhoneForWhatsApp('(11) 99988-7766')).toBe('+5511999887766')
    })

    it('should preserve existing + sign', () => {
      expect(formatPhoneForWhatsApp('+5511999887766')).toBe('+5511999887766')
    })
  })

  describe('formatPhoneDisplay', () => {
    it('should format 11-digit phone (mobile)', () => {
      expect(formatPhoneDisplay('11999887766')).toBe('(11) 99988-7766')
    })

    it('should format 10-digit phone (landline)', () => {
      expect(formatPhoneDisplay('1133334444')).toBe('(11) 3333-4444')
    })

    it('should return as-is for invalid length', () => {
      expect(formatPhoneDisplay('123')).toBe('123')
    })

    it('should handle already formatted phone', () => {
      expect(formatPhoneDisplay('(11) 99988-7766')).toBe('(11) 99988-7766')
    })
  })

  describe('isValidBrazilianPhone', () => {
    it('should validate 10-digit phone', () => {
      expect(isValidBrazilianPhone('1133334444')).toBe(true)
    })

    it('should validate 11-digit phone', () => {
      expect(isValidBrazilianPhone('11999887766')).toBe(true)
    })

    it('should validate phone with country code', () => {
      expect(isValidBrazilianPhone('5511999887766')).toBe(true)
    })

    it('should reject too short numbers', () => {
      expect(isValidBrazilianPhone('123456')).toBe(false)
    })

    it('should reject too long numbers', () => {
      expect(isValidBrazilianPhone('12345678901234')).toBe(false)
    })

    it('should handle formatted input', () => {
      expect(isValidBrazilianPhone('(11) 99988-7766')).toBe(true)
    })
  })
})
