# Header Component

A reusable header component for authenticated pages in the PDF Service application.

## Overview

The header component provides a consistent navigation bar across authenticated pages with user information and customizable action buttons. The landing page uses its own unique header design and does not use this component.

## Files

- **Component:** `public/js/header.js`
- **Styles:** `public/css/header.css`
- **Usage:** Included in authenticated pages (dashboard, profile, etc.)

## Features

- ✅ Dynamic user avatar (initials from name)
- ✅ User name display
- ✅ Customizable action buttons
- ✅ Automatic user data loading from localStorage or API
- ✅ Built-in logout functionality
- ✅ Responsive design
- ✅ Accessible (ARIA labels, semantic HTML)

## Usage

### Basic Setup

1. Include the CSS file in your HTML:
```html
<link rel="stylesheet" href="../css/header.css">
```

2. Add a container div for the header:
```html
<div id="header-container"></div>
```

3. Include the JavaScript file:
```html
<script src="/js/header.js"></script>
```

4. Initialize the header:
```javascript
document.addEventListener('DOMContentLoaded', function() {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        const header = HeaderComponent.create({
            actions: [
                { 
                    text: 'Profile', 
                    href: '/pages/profile.html', 
                    class: 'btn-secondary',
                    ariaLabel: 'View profile settings'
                },
                { 
                    text: 'Sign Out', 
                    id: 'logoutBtn', 
                    class: 'btn-danger', 
                    type: 'button',
                    ariaLabel: 'Sign out of account'
                }
            ]
        });
        
        headerContainer.appendChild(header);
        
        // Load user data
        HeaderComponent.loadUserData();
        
        // Setup logout
        HeaderComponent.setupLogout();
    }
});
```

## API Reference

### `HeaderComponent.create(options)`

Creates and returns a header element.

**Parameters:**
- `options` (Object, optional) - Configuration options
  - `logoHref` (string, default: `/pages/landing.html`) - Logo link destination
  - `logoText` (string, default: `PDF Service`) - Logo text
  - `actions` (Array, default: `[]`) - Action buttons array
  - `showUserInfo` (boolean, default: `true`) - Whether to show user info section
  - `userAvatarId` (string, default: `userAvatar`) - ID for user avatar element
  - `userNameId` (string, default: `userName`) - ID for user name element
  - `logoutBtnId` (string, default: `logoutBtn`) - ID for logout button element
  - `headerId` (string, default: `appHeader`) - ID for the header element

**Returns:** HTMLElement - The created header element

**Action Button Options:**
```javascript
{
    text: 'Button Text',           // Required
    href: '/path/to/page',         // Optional - creates link if provided
    class: 'btn-secondary',        // Optional - button CSS class
    id: 'buttonId',                // Optional - button ID
    type: 'button',                // Optional - 'button' for button, omit for link
    ariaLabel: 'Accessible label', // Optional - ARIA label
    onClick: function() { ... }    // Optional - click handler
}
```

### `HeaderComponent.loadUserData(avatarId, nameId)`

Loads user data from localStorage or API and updates the header.

**Parameters:**
- `avatarId` (string, default: `userAvatar`) - ID of avatar element
- `nameId` (string, default: `userName`) - ID of name element

### `HeaderComponent.setupLogout(logoutBtnId)`

Sets up logout functionality for the logout button.

**Parameters:**
- `logoutBtnId` (string, default: `logoutBtn`) - ID of logout button

## Examples

### Dashboard Page (Profile + Sign Out)
```javascript
const header = HeaderComponent.create({
    actions: [
        { 
            text: 'Profile', 
            href: '/pages/profile.html', 
            class: 'btn-secondary',
            ariaLabel: 'View profile settings'
        },
        { 
            text: 'Sign Out', 
            id: 'logoutBtn', 
            class: 'btn-danger', 
            type: 'button',
            ariaLabel: 'Sign out of account'
        }
    ]
});
```

### Profile Page (Dashboard + Sign Out)
```javascript
const header = HeaderComponent.create({
    actions: [
        { 
            text: 'Dashboard', 
            href: '/pages/dashboard.html', 
            class: 'btn-secondary',
            ariaLabel: 'Go back to dashboard'
        },
        { 
            text: 'Sign Out', 
            id: 'logoutBtn', 
            class: 'btn-danger', 
            type: 'button',
            ariaLabel: 'Sign out of account'
        }
    ]
});
```

### Custom Page with Multiple Actions
```javascript
const header = HeaderComponent.create({
    actions: [
        { text: 'Home', href: '/pages/dashboard.html', class: 'btn-secondary' },
        { text: 'Settings', href: '/pages/settings.html', class: 'btn-secondary' },
        { text: 'Help', href: '/pages/help.html', class: 'btn-secondary' },
        { text: 'Sign Out', id: 'logoutBtn', class: 'btn-danger', type: 'button' }
    ]
});
```

### No User Info (Public-ish Page)
```javascript
const header = HeaderComponent.create({
    showUserInfo: false,
    actions: [
        { text: 'Login', href: '/pages/login.html', class: 'btn-primary' }
    ]
});
```

## Styling

The header component uses CSS classes that should be available:
- `.header` - Main header container
- `.nav` - Navigation container
- `.logo` - Logo link
- `.nav-user` - User section container
- `.user-info` - User information container
- `.user-avatar` - Avatar circle
- `.user-name` - User name text
- `.card-actions` - Action buttons container (margin-top removed in headers)
- `.btn` - Button base class
- `.btn-primary`, `.btn-secondary`, `.btn-danger` - Button variants

All styles are in `public/css/header.css`.

## Pages Using This Component

- ✅ Dashboard (`dashboard.html`)
- ✅ Profile (`profile.html`)
- ❌ Landing (`landing.html`) - Uses custom header
- ❌ Login/Register - No headers
- ✅ Other authenticated pages (can be added as needed)

## Notes

- The component automatically loads user data from localStorage or fetches from `/dashboard/profile` API
- User avatar shows initials from first and last name, or "U" as fallback
- Logout functionality clears localStorage and redirects to login page
- The header is sticky (stays at top when scrolling)
- Responsive design adapts on mobile devices

