# Client Production Readiness

This document tracks the minimum production-readiness requirements for the RS Real Estate client dashboard.

## Current Status

The client dashboard build currently passes with npm run build.

Known non-blocking warning:
Some chunks are larger than 500 kB after minification.

This is not a production blocker for MVP launch, but should be improved later with route-level or component-level code splitting.

## Required Frontend Environment Variable

VITE_API_BASE_URL=https://your-backend-domain.com/api/v1

Local development value:

VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1

## Pre-Deployment Checklist

### Build

- [ ] npm install completes successfully
- [ ] npm run build passes
- [ ] No TypeScript build errors
- [ ] No missing imports
- [ ] No broken routes/screens

### Auth

- [ ] Client login works
- [ ] Invalid login shows a clear error
- [ ] Token persists after refresh
- [ ] Logout clears session
- [ ] Password reset page opens from reset token URL

### Dashboard Navigation

- [ ] Dashboard opens after login
- [ ] Sidebar navigation works
- [ ] AI Studio opens
- [ ] Media Library opens
- [ ] Analytics opens
- [ ] CRM opens
- [ ] Properties opens
- [ ] Scheduler opens
- [ ] Reports opens
- [ ] Team opens
- [ ] Billing opens
- [ ] Support opens
- [ ] Settings opens
- [ ] AI Manager opens
- [ ] Automation opens

### Core Client Workflows

- [ ] Profile loads correctly
- [ ] Notifications load without console errors
- [ ] Leads load from backend
- [ ] Properties load from backend
- [ ] Media Library loads assets
- [ ] Asset upload works
- [ ] Create generated post draft from media works
- [ ] AI Studio loads generated posts
- [ ] Copy generated post works
- [ ] Schedule generated post works
- [ ] Reports page loads
- [ ] Email report action works if backend SMTP is configured
- [ ] Support ticket creation works

### Browser QA

- [ ] Chrome desktop
- [ ] Edge desktop
- [ ] Mobile responsive check
- [ ] No horizontal overflow
- [ ] No major console errors
- [ ] Dark/light mode works

### Production API Checks

- [ ] Backend is deployed
- [ ] Backend /api/v1 base URL is reachable
- [ ] CORS allows frontend production domain
- [ ] JWT auth works against production backend
- [ ] File/media URLs resolve correctly
- [ ] SMTP variables configured if password reset/report emails are enabled

## Deployment Notes

For Vercel or similar static hosting:

Build command:
npm run build

Output directory:
dist

Required production env:
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1

## MVP Launch Gate

Client dashboard is launch-ready only when:

- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] Database migrated
- [ ] CORS configured
- [ ] Login works on production URL
- [ ] Main client workflows pass smoke test
- [ ] No blocking console/runtime errors
