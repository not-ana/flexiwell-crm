import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

describe('OnboardingModal Component', () => {
  it('should render when open', () => {
    render(<OnboardingModal isOpen={true} onClose={() => {}} />)

    // Check if modal is visible
    // Adjust text according to your actual component
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<OnboardingModal isOpen={false} onClose={() => {}} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<OnboardingModal isOpen={true} onClose={onClose} />)

    // Look for close button (adjust selector according to your component)
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should navigate through steps', () => {
    render(<OnboardingModal isOpen={true} onClose={() => {}} />)

    // Test navigation between onboarding steps
    // Adjust according to your component's actual structure

    // Example: click "Next"
    // const nextButton = screen.getByText(/next/i)
    // fireEvent.click(nextButton)

    // Verify it advanced to next step
    // expect(screen.getByText(/step 2/i)).toBeInTheDocument()
  })
})
