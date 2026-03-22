import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddAccountModal } from '@/components/modals/AddAccountModal'

describe('AddAccountModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onAddAccount: vi.fn().mockResolvedValue(undefined),
  }

  it('should not render when closed', () => {
    render(<AddAccountModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Add account')).not.toBeInTheDocument()
  })

  it('should render role selection step initially', () => {
    render(<AddAccountModal {...defaultProps} />)
    expect(screen.getByText('Add account')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Teacher')).toBeInTheDocument()
    expect(screen.getByText('Continue')).toBeInTheDocument()
  })

  it('should advance to credentials step on Continue', () => {
    render(<AddAccountModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Continue'))

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
  })

  it('should go back to role step when Back is clicked', () => {
    render(<AddAccountModal {...defaultProps} />)
    // Go to credentials step
    fireEvent.click(screen.getByText('Continue'))
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()

    // Go back
    fireEvent.click(screen.getByText('Back'))
    expect(screen.getByText('Add account')).toBeInTheDocument()
  })

  it('should disable Sign in button when email/password are empty', () => {
    render(<AddAccountModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Continue'))

    // Get the submit button (not the heading)
    const signInButtons = screen.getAllByText('Sign in')
    const submitButton = signInButtons.find(el => el.tagName === 'BUTTON')!
    expect(submitButton).toBeDisabled()
  })

  it('should enable Sign in button when email and password are filled', () => {
    render(<AddAccountModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Continue'))

    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'test@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'password123' },
    })

    const signInButtons = screen.getAllByText('Sign in')
    const submitButton = signInButtons.find(el => el.tagName === 'BUTTON')!
    expect(submitButton).not.toBeDisabled()
  })

  it('should call onAddAccount with correct data on submit', async () => {
    const onAddAccount = vi.fn().mockResolvedValue(undefined)
    render(<AddAccountModal {...defaultProps} onAddAccount={onAddAccount} />)

    // Select teacher role
    fireEvent.click(screen.getByText('Teacher'))

    // Go to credentials
    fireEvent.click(screen.getByText('Continue'))

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
      target: { value: 'teacher@test.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
      target: { value: 'pass123' },
    })

    // Submit - get the button, not the heading
    const signInButtons = screen.getAllByText('Sign in')
    const submitButton = signInButtons.find(el => el.tagName === 'BUTTON')!
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(onAddAccount).toHaveBeenCalledWith('teacher@test.com', 'pass123', 'teacher')
    })
  })

  it('should call onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<AddAccountModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalled()
  })

  it('should show Google sign in option on credentials step', () => {
    render(<AddAccountModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Continue'))
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })
})
