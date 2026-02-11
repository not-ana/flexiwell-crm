import { describe, it, expect } from 'vitest'
import {
  getInitials,
  formatCurrency,
  formatPhone,
  truncate,
  formatFileSize,
  formatPercentage,
} from '@/lib/utils/formatters'

describe('Formatters Utils', () => {
  describe('getInitials', () => {
    it('should return initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Mary Jane Watson')).toBe('MJ')
    })

    it('should handle single name', () => {
      expect(getInitials('Maria')).toBe('M')
    })

    it('should return empty string for empty input', () => {
      expect(getInitials('')).toBe('')
    })

    it('should convert to uppercase', () => {
      expect(getInitials('john doe')).toBe('JD')
    })
  })

  describe('formatCurrency', () => {
    it('should format BRL currency', () => {
      const result = formatCurrency(1500.50, 'BRL', 'pt-BR')
      expect(result).toContain('1.500')
      expect(result).toContain('50')
    })

    it('should format USD currency', () => {
      const result = formatCurrency(1234.56)
      expect(result).toBe('$1,234.56')
    })

    it('should handle zero', () => {
      const result = formatCurrency(0, 'BRL', 'pt-BR')
      expect(result).toContain('0')
    })
  })

  describe('formatPhone', () => {
    it('should format 10-digit US number', () => {
      expect(formatPhone('5551234567')).toBe('(555) 123-4567')
    })

    it('should format 11-digit US number with country code', () => {
      expect(formatPhone('15551234567')).toBe('+1 (555) 123-4567')
    })

    it('should handle empty input', () => {
      expect(formatPhone('')).toBe('')
    })

    it('should remove non-numeric characters', () => {
      expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567')
    })
  })

  describe('truncate', () => {
    it('should truncate long text', () => {
      expect(truncate('This is a very long text', 10)).toBe('This is...')
    })

    it('should not truncate short text', () => {
      expect(truncate('Short', 10)).toBe('Short')
    })

    it('should use custom suffix', () => {
      expect(truncate('Long text', 8, '…')).toBe('Long te…')
    })
  })

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
      expect(formatFileSize(500)).toBe('500 Bytes')
    })

    it('should format KB', () => {
      expect(formatFileSize(1024)).toBe('1 KB')
      expect(formatFileSize(2048)).toBe('2 KB')
    })

    it('should format MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB')
      expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
    })

    it('should format GB', () => {
      expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2 GB')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentage from decimal', () => {
      expect(formatPercentage(0.5, 0, true)).toBe('50%')
      expect(formatPercentage(0.755, 2, true)).toBe('75.50%')
    })

    it('should format percentage from number', () => {
      expect(formatPercentage(50)).toBe('50%')
      expect(formatPercentage(75.5, 1)).toBe('75.5%')
    })
  })
})
