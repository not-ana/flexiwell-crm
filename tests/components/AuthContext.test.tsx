import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Track router.push calls
const mockPush = vi.fn()
const mockReplace = vi.fn()
let mockPathname = '/'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}))

// Mock the API client
const mockGetStoredTokens = vi.fn().mockReturnValue({ accessToken: null, refreshToken: null })
const mockStoreTokens = vi.fn()
const mockClearTokens = vi.fn()
const mockAuthApi = {
  me: vi.fn().mockResolvedValue({ data: null }),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn().mockResolvedValue({}),
}

vi.mock('@/lib/api/client', () => ({
  getStoredTokens: () => mockGetStoredTokens(),
  storeTokens: (...args: unknown[]) => mockStoreTokens(...args),
  clearTokens: () => mockClearTokens(),
  authApi: {
    me: () => mockAuthApi.me(),
    login: (creds: unknown) => mockAuthApi.login(creds),
    register: (data: unknown) => mockAuthApi.register(data),
    logout: () => mockAuthApi.logout(),
  },
}))

// Helper component to expose auth context values
function AuthConsumer({ onAuth }: { onAuth: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth()
  onAuth(auth)
  return <div data-testid="consumer">{auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
}

describe('AuthContext - Route Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/'
    mockGetStoredTokens.mockReturnValue({ accessToken: null, refreshToken: null })
    mockAuthApi.me.mockResolvedValue({ data: null })
  })

  it('should not redirect on public routes when unauthenticated', async () => {
    mockPathname = '/login'

    render(
      <AuthProvider>
        <div>Login Page</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  it('should redirect to /login when accessing /admin unauthenticated', async () => {
    mockPathname = '/admin'

    render(
      <AuthProvider>
        <div>Admin Page</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should redirect to /login when accessing /dashboard unauthenticated', async () => {
    mockPathname = '/dashboard'

    render(
      <AuthProvider>
        <div>Dashboard Page</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should redirect to /login when accessing /teacher unauthenticated', async () => {
    mockPathname = '/teacher'

    render(
      <AuthProvider>
        <div>Teacher Page</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should redirect admin user away from /teacher to /admin', async () => {
    mockPathname = '/teacher'
    mockGetStoredTokens.mockReturnValue({ accessToken: 'token', refreshToken: 'refresh' })
    mockAuthApi.me.mockResolvedValue({
      data: { user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' } },
    })

    render(
      <AuthProvider>
        <div>Teacher Page</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  it('should redirect client user away from /admin to /dashboard', async () => {
    mockPathname = '/admin'
    mockGetStoredTokens.mockReturnValue({ accessToken: 'token', refreshToken: 'refresh' })
    mockAuthApi.me.mockResolvedValue({
      data: { user: { id: '2', name: 'Client', email: 'client@test.com', role: 'client' } },
    })

    render(
      <AuthProvider>
        <div>Admin Page</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('should redirect teacher user away from /admin to /teacher', async () => {
    mockPathname = '/admin'
    mockGetStoredTokens.mockReturnValue({ accessToken: 'token', refreshToken: 'refresh' })
    mockAuthApi.me.mockResolvedValue({
      data: { user: { id: '3', name: 'Teacher', email: 'teacher@test.com', role: 'teacher' } },
    })

    render(
      <AuthProvider>
        <div>Admin Page</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/teacher')
    })
  })

  it('should not redirect admin user on /admin routes', async () => {
    mockPathname = '/admin/clients'
    mockGetStoredTokens.mockReturnValue({ accessToken: 'token', refreshToken: 'refresh' })
    mockAuthApi.me.mockResolvedValue({
      data: { user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' } },
    })

    render(
      <AuthProvider>
        <div>Clients Page</div>
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Clients Page')).toBeInTheDocument()
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should allow public routes without auth (/, /pricing, /signup)', async () => {
    const publicPaths = ['/', '/pricing', '/signup', '/login']

    for (const path of publicPaths) {
      vi.clearAllMocks()
      mockPathname = path

      const { unmount } = render(
        <AuthProvider>
          <div>{path}</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled()
      })

      unmount()
    }
  })
})

describe('AuthContext - Login Redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/login'
    mockGetStoredTokens.mockReturnValue({ accessToken: null, refreshToken: null })
    mockAuthApi.me.mockResolvedValue({ data: null })
  })

  it('should redirect admin to /admin after login', async () => {
    mockAuthApi.login.mockResolvedValue({
      data: {
        user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' },
        tokens: { accessToken: 'at', refreshToken: 'rt' },
      },
    })

    let authContext: ReturnType<typeof useAuth> | null = null

    render(
      <AuthProvider>
        <AuthConsumer onAuth={(auth) => { authContext = auth }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authContext).not.toBeNull()
    })

    await act(async () => {
      await authContext!.login({ email: 'admin@test.com', password: 'pass' })
    })

    expect(mockStoreTokens).toHaveBeenCalledWith('at', 'rt')
    expect(mockPush).toHaveBeenCalledWith('/admin')
  })

  it('should redirect client to /dashboard after login', async () => {
    mockAuthApi.login.mockResolvedValue({
      data: {
        user: { id: '2', name: 'Client', email: 'client@test.com', role: 'client' },
        tokens: { accessToken: 'at', refreshToken: 'rt' },
      },
    })

    let authContext: ReturnType<typeof useAuth> | null = null

    render(
      <AuthProvider>
        <AuthConsumer onAuth={(auth) => { authContext = auth }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authContext).not.toBeNull()
    })

    await act(async () => {
      await authContext!.login({ email: 'client@test.com', password: 'pass' })
    })

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('should redirect teacher to /teacher after login', async () => {
    mockAuthApi.login.mockResolvedValue({
      data: {
        user: { id: '3', name: 'Teacher', email: 'teacher@test.com', role: 'teacher' },
        tokens: { accessToken: 'at', refreshToken: 'rt' },
      },
    })

    let authContext: ReturnType<typeof useAuth> | null = null

    render(
      <AuthProvider>
        <AuthConsumer onAuth={(auth) => { authContext = auth }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authContext).not.toBeNull()
    })

    await act(async () => {
      await authContext!.login({ email: 'teacher@test.com', password: 'pass' })
    })

    expect(mockPush).toHaveBeenCalledWith('/teacher')
  })
})

describe('AuthContext - Logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/admin'
    mockGetStoredTokens.mockReturnValue({ accessToken: 'token', refreshToken: 'refresh' })
    mockAuthApi.me.mockResolvedValue({
      data: { user: { id: '1', name: 'Admin', email: 'admin@test.com', role: 'admin' } },
    })
  })

  it('should clear tokens and redirect to /login on logout', async () => {
    let authContext: ReturnType<typeof useAuth> | null = null

    render(
      <AuthProvider>
        <AuthConsumer onAuth={(auth) => { authContext = auth }} />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(authContext?.isAuthenticated).toBe(true)
    })

    await act(async () => {
      await authContext!.logout()
    })

    expect(mockClearTokens).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/login')
  })
})
