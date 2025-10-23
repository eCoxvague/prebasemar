# Authentication Components

This directory contains all authentication-related components for the Farcaster Prediction Market application.

## Components

### FarcasterAuth
Main authentication component that handles Farcaster sign-in flow.

```tsx
import { FarcasterAuth } from '@/components/auth';

<FarcasterAuth 
  onSuccess={() => console.log('Logged in!')}
  onError={(error) => console.error(error)}
/>
```

### LoginButton
Simple button component for triggering authentication.

```tsx
import { LoginButton } from '@/components/auth';

<LoginButton variant="primary" />
```

Variants: `primary`, `secondary`, `outline`

### LogoutButton
Button component for logging out users.

```tsx
import { LogoutButton } from '@/components/auth';

<LogoutButton variant="text" />
```

Variants: `primary`, `secondary`, `text`

### UserProfileDropdown
Dropdown menu showing user profile and navigation options.

```tsx
import { UserProfileDropdown } from '@/components/auth';

<UserProfileDropdown />
```

### ProtectedRoute
Wrapper component that requires authentication to access content.

```tsx
import { ProtectedRoute } from '@/components/auth';

<ProtectedRoute redirectTo="/login" showLoginPrompt={true}>
  <YourProtectedContent />
</ProtectedRoute>
```

## Usage with AuthContext

All components use the `AuthContext` for state management:

```tsx
import { useAuth } from '@/lib/context/AuthContext';

function MyComponent() {
  const { user, loading, login, logout, updateWallet } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <LoginButton />;
  
  return <div>Welcome, {user.displayName}!</div>;
}
```

## Authentication Flow

1. User clicks "Sign in with Farcaster"
2. Farcaster Auth Kit handles the authentication
3. Backend verifies the signature via `/api/auth/farcaster`
4. Session is stored in Vercel KV (24h TTL)
5. User data is cached (1h TTL)
6. User is redirected to the app

## API Endpoints

- `POST /api/auth/farcaster` - Authenticate with Farcaster
- `GET /api/auth/session?fid={fid}` - Get current session
- `DELETE /api/auth/session?fid={fid}` - Logout (delete session)
- `GET /api/users/{fid}/profile` - Get user profile (cached)
- `GET /api/users/bulk?fids=1,2,3` - Get multiple user profiles

## Development Notes

Currently using mock authentication for development. To integrate with real Farcaster Auth Kit:

1. Install `@farcaster/auth-kit`
2. Update `FarcasterAuth.tsx` to use the real SDK
3. Configure Farcaster app credentials in `.env`
4. Update signature verification in `lib/auth/farcaster.ts`

## Session Management

Sessions are stored in Vercel KV with:
- **Key**: `session:{fid}`
- **TTL**: 24 hours
- **Data**: FID, username, displayName, pfpUrl, walletAddress

User profiles are cached with:
- **Key**: `user:{fid}`
- **TTL**: 1 hour
- **Data**: FID, username, displayName, pfpUrl, bio
