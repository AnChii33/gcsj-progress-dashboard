# Google Cloud Skills Boost Progress Tracker

A comprehensive dashboard for tracking Google Cloud Skills Boost participant progress at St. Thomas' College of Engineering & Technology, Kolkata.

## Features

- **Public Dashboard**: View all participants and their progress
- **Participant Details**: Day-wise timeline of course completions (email verification required)
- **Admin Portal**: Upload CSV files, manage data, and view analytics
- **Database Integration**: All data persisted in Supabase (works across all browsers)
- **Delete Uploads**: Remove uploaded CSV files and cascade delete related data
- **Admin Settings**: Change admin email and password from within the dashboard

## Admin Credentials

**Default Email**: `admin@stcet.edu.in`
**Default Password**: `AdminSTCET2024!`

**Important**: Admin credentials are stored in Supabase database, so they work across all browsers and incognito mode. You can change these credentials from the Settings page after logging in.

## Usage

### Public Dashboard (`/`)
- Browse all participants alphabetically
- Search by name (emails are hidden for privacy)
- Sort by name or badge count
- Click on any participant to view detailed progress (requires email verification)

### Admin Portal (`/admin`)
1. Login with admin credentials at `/admin/login`
2. Upload CSV files with corresponding dates
3. View top performers and badge distribution pie chart
4. Delete uploaded files as needed
5. Access Settings to change admin credentials

### Admin Settings (`/admin/settings`)
- Change admin email address
- Update admin password (minimum 8 characters)
- Changes take effect immediately and persist across browsers

### CSV Upload Format
The CSV file should contain these columns:
- User Name
- User Email
- Google Cloud Skills Boost Profile URL
- Profile URL Status
- Access Code Redemption Status
- All Skill Badges & Games Completed
- \# of Skill Badges Completed
- Names of Completed Skill Badges
- \# of Arcade Games Completed
- Names of Completed Arcade Games

**Important**: When uploading a CSV with date Oct 8, it represents progress up to Oct 7 midnight.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
