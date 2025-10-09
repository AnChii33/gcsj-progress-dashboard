# Google Cloud Skills Boost Progress Tracker

A comprehensive dashboard for tracking Google Cloud Skills Boost participant progress at St. Thomas' College of Engineering & Technology, Kolkata.

## Features

- **Public Dashboard**: View all participants and their progress
- **Participant Details**: Day-wise timeline of course completions (email verification required)
- **Admin Portal**: Upload CSV files, manage data, and view analytics
- **Database Integration**: All data persisted in Supabase
- **Delete Uploads**: Remove uploaded CSV files and cascade delete related data

## Usage

### Public Dashboard (`/`)
- Browse all participants alphabetically
- Search by name
- Sort by name or badge count
- Click on any participant to view detailed progress (requires email verification)

### Admin Portal (`/admin`)
1. Login with admin credentials
2. Upload CSV files with corresponding dates
3. View top performers and badge distribution
4. Delete uploaded files as needed

### CSV Upload Format
The CSV file should contain these columns:
- User Name
- User Email
- Google Cloud Skills Boost Profile URL
- Profile URL Status
- Access Code Redemption Status
- All Skill Badges & Games Completed
- # of Skill Badges Completed
- Names of Completed Skill Badges
- # of Arcade Games Completed
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
