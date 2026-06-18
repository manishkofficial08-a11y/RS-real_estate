# Client Smoke Test Checklist

Run this checklist before merging production-related client changes or deploying the client dashboard.

## 1. Setup

- [ ] npm install
- [ ] npm run build
- [ ] npm run dev
- [ ] Open http://localhost:5173

## 2. Authentication

- [ ] Login page opens
- [ ] Valid client login succeeds
- [ ] Invalid credentials show error
- [ ] Refresh keeps user logged in
- [ ] Logout returns user to login
- [ ] Password reset route opens with token

## 3. Navigation

Click every client module:

- [ ] Dashboard
- [ ] Media Library
- [ ] AI Studio
- [ ] Scheduler
- [ ] Analytics
- [ ] CRM
- [ ] Properties
- [ ] Reports
- [ ] Team
- [ ] Automation
- [ ] Billing
- [ ] Support
- [ ] Settings
- [ ] AI Manager

Expected result:

- [ ] Page opens
- [ ] No blank screen
- [ ] No red console errors
- [ ] Sidebar active state updates

## 4. CRM and Properties

- [ ] Leads load
- [ ] Add lead works
- [ ] Edit or update lead works
- [ ] Properties load
- [ ] Add or update property works

## 5. Media and Generated Posts

- [ ] Media Library opens
- [ ] Upload asset works
- [ ] Asset detail opens
- [ ] Create Draft Post works
- [ ] AI Studio shows generated posts
- [ ] Copy generated post works
- [ ] Schedule generated post works

## 6. Scheduler

- [ ] Scheduled posts load
- [ ] New schedule can be created
- [ ] Schedule can be cancelled or updated
- [ ] Calendar/list view does not break

## 7. Reports

- [ ] Reports page opens
- [ ] Lead/property/generated post data is reflected
- [ ] Download/export works
- [ ] Email report action works if backend email config is available

## 8. Support

- [ ] Support page opens
- [ ] Ticket creation works
- [ ] Ticket list loads
- [ ] Notifications open support when relevant

## 9. Responsive QA

Check at:

- [ ] 1440px desktop
- [ ] 1024px tablet
- [ ] 768px small tablet
- [ ] 390px mobile

Expected:

- [ ] No horizontal overflow
- [ ] Sidebar remains usable
- [ ] Cards do not overlap badly
- [ ] Main content scroll works

## 10. Final Production Gate

- [ ] npm run build passes
- [ ] Production VITE_API_BASE_URL configured
- [ ] Backend production URL reachable
- [ ] CORS configured
- [ ] Login works against production backend
- [ ] No blocking console/runtime errors
