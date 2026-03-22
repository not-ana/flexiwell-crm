import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SignOutModal } from '@/components/modals/SignOutModal'

describe('SignOutModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  }

  it('should render when open', () => {
    render(<SignOutModal {...defaultProps} />)
    expect(screen.getByRole('heading', { name: 'Sign out' })).toBeInTheDocument()
    expect(screen.getByText('Cancel')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<SignOutModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Sign out')).not.toBeInTheDocument()
  })

  it('should display user name when provided', () => {
    render(<SignOutModal {...defaultProps} userName="Ana" />)
    expect(screen.getByText(/from Ana/)).toBeInTheDocument()
  })

  it('should show generic message when no userName', () => {
    render(<SignOutModal {...defaultProps} />)
    expect(screen.getByText('Are you sure you want to sign out?')).toBeInTheDocument()
  })

  it('should call onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    render(<SignOutModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onConfirm when Sign out button is clicked', () => {
    const onConfirm = vi.fn()
    render(<SignOutModal {...defaultProps} onConfirm={onConfirm} />)
    // There are two "Sign out" texts - heading and button. Get the button.
    const buttons = screen.getAllByText('Sign out')
    const signOutButton = buttons.find(el => el.tagName === 'BUTTON' && el.closest('.flex.gap-3'))!
    fireEvent.click(signOutButton)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
