import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => {
    const { width, height, src } = props as { width: number; height: number; src: string }
    return <img alt={alt} src={src} width={width} height={height} />
  },
}))

describe('OnboardingModal', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    role: 'admin' as const,
  }

  // --- Rendering ---

  it('should not render when closed', () => {
    render(<OnboardingModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByText('Welcome to FlexiWell Admin')).not.toBeInTheDocument()
  })

  it('should render welcome screen initially for admin', () => {
    render(<OnboardingModal {...defaultProps} />)
    expect(screen.getByText('Welcome to FlexiWell Admin')).toBeInTheDocument()
    expect(screen.getByText('Start Tour')).toBeInTheDocument()
    expect(screen.getByText('Skip for now')).toBeInTheDocument()
  })

  it('should render welcome screen for teacher role', () => {
    render(<OnboardingModal {...defaultProps} role="teacher" />)
    expect(screen.getByText('Welcome to FlexiWell Teacher Portal')).toBeInTheDocument()
  })

  it('should render welcome screen for client role', () => {
    render(<OnboardingModal {...defaultProps} role="client" />)
    expect(screen.getByText('Welcome to FlexiWell')).toBeInTheDocument()
  })

  // --- Navigation ---

  it('should navigate from welcome to first step on Start Tour', () => {
    render(<OnboardingModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Start Tour'))
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
  })

  it('should navigate through all admin steps with Next button', () => {
    render(<OnboardingModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Start Tour'))

    const expectedSteps = [
      'Dashboard Overview',
      'Client Management',
      'Staff & Team Management',
      'Waitlist Feature',
      'Payments & Billing',
      'WhatsApp Integration',
    ]

    expect(screen.getByText(expectedSteps[0])).toBeInTheDocument()

    for (let i = 1; i < expectedSteps.length; i++) {
      fireEvent.click(screen.getByText('Next'))
      expect(screen.getByText(expectedSteps[i])).toBeInTheDocument()
    }

    // Last step shows "Get Started" instead of "Next"
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('should go back to previous step with Back button', () => {
    render(<OnboardingModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Start Tour'))
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Next'))
    expect(screen.getByText('Client Management')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Back'))
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
  })

  it('should go back to welcome screen from first step', () => {
    render(<OnboardingModal {...defaultProps} />)
    fireEvent.click(screen.getByText('Start Tour'))
    fireEvent.click(screen.getByText('Back'))
    expect(screen.getByText('Welcome to FlexiWell Admin')).toBeInTheDocument()
  })

  // --- Completion ---

  it('should call onClose and save to localStorage on Get Started', () => {
    const onClose = vi.fn()
    render(<OnboardingModal {...defaultProps} onClose={onClose} />)

    // Navigate to last step
    fireEvent.click(screen.getByText('Start Tour'))
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next'))
    }

    fireEvent.click(screen.getByText('Get Started'))
    expect(onClose).toHaveBeenCalled()
    expect(localStorage.getItem('onboarding_completed_admin')).toBe('true')
  })

  it('should call onComplete callback when finishing tour', () => {
    const onComplete = vi.fn()
    render(<OnboardingModal {...defaultProps} onComplete={onComplete} />)

    fireEvent.click(screen.getByText('Start Tour'))
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next'))
    }
    fireEvent.click(screen.getByText('Get Started'))
    expect(onComplete).toHaveBeenCalled()
  })

  it('should save to localStorage and close on Skip for now', () => {
    const onClose = vi.fn()
    render(<OnboardingModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByText('Skip for now'))
    expect(onClose).toHaveBeenCalled()
    expect(localStorage.getItem('onboarding_completed_admin')).toBe('true')
  })

  // --- Progress bar ---

  it('should show progress bar', () => {
    const { container } = render(<OnboardingModal {...defaultProps} />)
    const progressBar = container.querySelector('.bg-primary-600.transition-all')
    expect(progressBar).toBeInTheDocument()
  })
})
