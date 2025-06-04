# Admin Management Scripts

## Adding Admin Users

### Method 1: Using the Script (Command Line)

Use the `add-admin.js` script to add admin users from the command line:

```bash
# Basic usage
node scripts/add-admin.js <email> [firstName] [lastName] [role]

# Examples
node scripts/add-admin.js john@example.com John Doe ADMIN
node scripts/add-admin.js sarah@company.com Sarah Johnson SUPER_ADMIN
node scripts/add-admin.js admin@test.com "" "" ADMIN
```

**Parameters:**
- `email` (required): The Google email address that will be used for authentication
- `firstName` (optional): User's first name
- `lastName` (optional): User's last name  
- `role` (optional): Either `ADMIN` or `SUPER_ADMIN` (defaults to `ADMIN`)

### Method 2: Using the Web Interface

Super Admins can manage users through the web interface:

1. Sign in as a Super Admin
2. Navigate to "Users" in the admin panel (only visible to Super Admins)
3. Click "Add New Admin" to add users via the web form
4. Manage existing user roles directly in the table

## User Roles

- **ADMIN**: Can access all admin features (tests, invitations, analytics)
- **SUPER_ADMIN**: Can access all admin features + user management

## How Google Authentication Works

1. **Pre-registration Required**: Users must be added to the database first using either method above
2. **Google Sign-in**: Users then sign in using their Google account at `/login`
3. **Role Verification**: Only users with `ADMIN` or `SUPER_ADMIN` roles can access the admin panel
4. **Automatic Profile Update**: When users sign in with Google, their name is automatically updated from their Google profile if not already set

## Security Notes

- Only pre-registered admin emails can sign in via Google
- Random Google users cannot become admins automatically
- Super Admins cannot change their own role (prevents lockout)
- All admin actions are logged in the application console 