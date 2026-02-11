import { describe, it, expect } from 'vitest'

// Teste simples para verificar que o Vitest está funcionando
describe('Simple Test', () => {
  it('should pass basic assertions', () => {
    expect(1 + 1).toBe(2)
    expect('hello').toBe('hello')
    expect(true).toBeTruthy()
  })

  it('should work with arrays', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })

  it('should work with objects', () => {
    const obj = { name: 'FlexiWell', type: 'CRM' }
    expect(obj).toHaveProperty('name')
    expect(obj.name).toBe('FlexiWell')
  })
})
