# RS Real Estate Social Publishing Setup

## Current status

Connected social account publishing is implemented for the client portal.

Implemented:
- Backend social account model
- Encrypted token storage
- Social account APIs
- Automation page connected to backend APIs
- Manual connect flow for YouTube, Instagram, Facebook, and LinkedIn
- Publisher service uses client connected credentials
- AI Studio publish modal enables only connected platforms
- Mock fallback disabled for connected account publishing

## Security rule

Never commit real access tokens, refresh tokens, client secrets, API keys, or OAuth secrets to GitHub.

## Backend production environment

Required:
- SECRET_KEY=change-this-in-production
- DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DATABASE
- BACKEND_CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com

YouTube app credentials:
- YOUTUBE_CLIENT_ID=your-google-oauth-client-id
- YOUTUBE_CLIENT_SECRET=your-google-oauth-client-secret
- YOUTUBE_PRIVACY_STATUS=public

Recommended:
- SOCIAL_PUBLISHER_MODE=real

## Frontend environment

Local:
- VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1

Production:
- VITE_API_BASE_URL=https://your-backend-domain.com/api/v1

## Migration

Run:
- cd backend
- alembic upgrade head
- alembic current

Expected:
- 20260619_add_social_accounts (head)

## Client workflow

1. Client logs in
2. Client opens Automation
3. Client connects social accounts
4. Client uploads or selects media
5. Client creates campaign drafts
6. Client opens AI Studio publish modal
7. Only connected platforms are enabled
8. Client publishes to selected connected platforms

## Demo guidance

Dummy tokens can be used only to test UI and backend storage.
Do not use dummy tokens for real publishing.
Real publishing requires valid platform tokens and permissions.

## Production recommendation

Manual token entry is acceptable for MVP testing.
For real SaaS production, replace manual token entry with OAuth flows:
- Google OAuth for YouTube
- Meta OAuth for Facebook and Instagram
- LinkedIn OAuth for LinkedIn

## Known limitations

- Real publishing depends on platform permissions and token validity
- YouTube publishing requires a linked video asset
- Instagram and Facebook video publishing require public media URLs
- LinkedIn media publishing can be expanded later

## Test checklist

- python -m compileall backend\app
- alembic current
- npm run build
- Login as client
- Open Automation page
- Connect dummy Instagram account
- Confirm stats change to 1/4
- Open AI Studio publish modal
- Confirm Instagram enabled and other platforms disabled
