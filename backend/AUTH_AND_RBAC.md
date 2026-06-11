# AUTHENTICATION AND RBAC IMPLEMENTATION GUIDE

## Overview

This document describes the complete authentication system with RBAC implemented for the AI Growth OS backend.

## Features Implemented

### 1. User Registration
- Email-based registration
- Password strength validation
- User role assignment (default: VIEWER)
- Duplicate email prevention

**Endpoint**: `POST /api/v1/auth/register`

```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!"
}
```

### 2. User Login
- Email/password authentication
- JWT access token generation
- Refresh token generation and storage
- Last login tracking
- Client IP logging

**Endpoint**: `POST /api/v1/auth/login`

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### 3. Token Refresh
- New access token generation
- Refresh token validation
- Token revocation check
- Expiration validation

**Endpoint**: `POST /api/v1/auth/refresh`

```json
{
  "refresh_token": "eyJhbGc..."
}
```

### 4. Password Management

#### Forgot Password
- Secure token generation
- 1-hour expiration
- Email-based reset link
- Single-use tokens

**Endpoint**: `POST /api/v1/auth/forgot-password`

```json
{
  "email": "user@example.com"
}
```

#### Reset Password
- Token verification
- Expiration check
- One-time use validation
- Password update

**Endpoint**: `POST /api/v1/auth/reset-password`

```json
{
  "token": "reset_token_here",
  "password": "NewPassword123!",
  "password_confirm": "NewPassword123!"
}
```

#### Change Password
- Current password validation
- Immediate password update
- Secure hashing

**Endpoint**: `POST /api/v1/auth/change-password`

```json
{
  "current_password": "SecurePass123!",
  "new_password": "NewPassword123!",
  "password_confirm": "NewPassword123!"
}
```

### 5. User Logout
- Refresh token revocation
- Session invalidation
- Multiple device support

**Endpoint**: `POST /api/v1/auth/logout`

## Role-Based Access Control (RBAC)

### User Roles

1. **SUPER_ADMIN**
   - Full system access
   - User management
   - Company management
   - Role management
   - Analytics access
   - Settings management

2. **COMPANY_OWNER**
   - Create/edit/delete own company
   - Manage company members
   - View company analytics
   - Content management

3. **COMPANY_ADMIN**
   - Manage company members
   - View company analytics
   - Content management
   - (Cannot delete company)

4. **EDITOR**
   - Create content
   - Edit own content
   - Delete own content
   - View content

5. **VIEWER**
   - View content only
   - Read-only access

### Permission System

Permissions are granular and mapped to roles:

```
MANAGE_USERS           -> SUPER_ADMIN
MANAGE_COMPANIES       -> SUPER_ADMIN
MANAGE_ROLES           -> SUPER_ADMIN
VIEW_ANALYTICS         -> SUPER_ADMIN
MANAGE_SETTINGS        -> SUPER_ADMIN
CREATE_COMPANY         -> SUPER_ADMIN, COMPANY_OWNER
EDIT_COMPANY           -> SUPER_ADMIN, COMPANY_OWNER
DELETE_COMPANY         -> SUPER_ADMIN, COMPANY_OWNER
MANAGE_COMPANY_MEMBERS -> SUPER_ADMIN, COMPANY_OWNER, COMPANY_ADMIN
VIEW_COMPANY_ANALYTICS -> SUPER_ADMIN, COMPANY_OWNER, COMPANY_ADMIN
CREATE_CONTENT         -> All roles except VIEWER
EDIT_CONTENT           -> SUPER_ADMIN, COMPANY_OWNER, COMPANY_ADMIN, EDITOR
DELETE_CONTENT         -> SUPER_ADMIN, COMPANY_OWNER, COMPANY_ADMIN, EDITOR
VIEW_CONTENT           -> All roles
```

## Route Protection

Routes are protected using dependency injection:

### Require Authentication
```python
@router.get("/protected")
async def protected_route(
    current_user = Depends(get_current_user),
):
    return {"user": current_user}
```

### Require Super Admin
```python
@router.get("/admin-only")
async def admin_only_route(
    _: UserRole = Depends(require_super_admin()),
):
    return {"message": "Super admin access"}
```

### Require Admin or Higher
```python
@router.get("/admin-or-higher")
async def admin_or_higher_route(
    _: UserRole = Depends(require_admin_or_higher()),
):
    return {"message": "Admin access"}
```

### Require Editor or Higher
```python
@router.get("/editor-or-higher")
async def editor_or_higher_route(
    _: UserRole = Depends(require_editor_or_higher()),
):
    return {"message": "Editor access"}
```

### Custom Role Requirement
```python
@router.get("/custom-roles")
async def custom_roles_route(
    _: UserRole = Depends(
        require_role(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER)
    ),
):
    return {"message": "Custom role access"}
```

## Database Models

### User
- `id` (UUID, primary key)
- `email` (unique, indexed)
- `first_name`
- `last_name`
- `phone` (optional)
- `password_hash` (bcrypt)
- `role` (UserRole enum)
- `is_active` (boolean)
- `email_verified` (boolean)
- `email_verified_at` (timestamp)
- `last_login_at` (timestamp)
- `last_login_ip` (string)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### PasswordResetToken
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `token_hash` (unique, indexed)
- `expires_at` (timestamp)
- `used_at` (timestamp, nullable)
- `created_at` (timestamp)

### EmailVerificationToken
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key)
- `token_hash` (unique, indexed)
- `expires_at` (timestamp)
- `verified_at` (timestamp, nullable)
- `created_at` (timestamp)

### RefreshToken
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key, indexed)
- `token_hash` (unique, indexed)
- `expires_at` (timestamp)
- `revoked_at` (timestamp, nullable)
- `created_at` (timestamp)

## Security Features

### Password Security
- Bcrypt hashing with configurable rounds (default 12)
- Password strength validation
  - Minimum 8 characters
  - Uppercase letter required
  - Lowercase letter required
  - Digit required
  - Special character required
- Separate password and password confirmation fields

### Token Security
- JWT with HS256 algorithm
- Access token expiration (default 30 minutes)
- Refresh token expiration (default 7 days)
- Refresh token tracking in database
- Token revocation support
- Secure token generation (secrets module)

### Session Security
- Client IP tracking
- Last login tracking
- Multiple device support (via refresh tokens)
- Logout invalidates all tokens

### Data Security
- Passwords stored as hashes only
- Email uniqueness enforced
- User role-based access control
- Request logging with correlation IDs
- Error messages don't leak sensitive information

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/forgot-password` - Initiate password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/logout` - Logout

### Users (Protected)
- `GET /api/v1/users/me` - Get profile
- `PATCH /api/v1/users/me` - Update profile
- `DELETE /api/v1/users/me` - Delete account
- `GET /api/v1/users` - List users (admin)
- `GET /api/v1/users/{user_id}` - Get user (admin)
- `PATCH /api/v1/users/{user_id}` - Update user (admin)
- `DELETE /api/v1/users/{user_id}` - Delete user (admin)

### Companies (Protected)
- `POST /api/v1/companies` - Create company
- `GET /api/v1/companies` - List companies
- `GET /api/v1/companies/{company_id}` - Get company
- `PATCH /api/v1/companies/{company_id}` - Update company
- `DELETE /api/v1/companies/{company_id}` - Delete company

### Admin (Protected - Super Admin Only)
- `GET /api/v1/admin/dashboard` - Dashboard stats
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/companies` - List all companies

## Usage Examples

### Register User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User (with Bearer Token)
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

### Refresh Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<refresh_token>"
  }'
```

## Configuration

Environment variables in `.env`:

```env
# JWT
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Security
BCRYPT_ROUNDS=12

# CORS
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

## Next Steps

1. Implement email service for password reset and email verification
2. Add email verification flow
3. Implement company member management
4. Add audit logging
5. Implement 2FA
6. Add API key authentication
7. Add rate limiting
8. Add request signing

---

**Status**: Complete Authentication with RBAC ✅
