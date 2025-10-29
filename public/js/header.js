/**
 * Header Component
 * 
 * Reusable header component for authenticated pages.
 * Displays user information and customizable action buttons.
 * 
 * @module header
 */

/**
 * Create and render header component
 * 
 * @param {Object} options - Configuration options
 * @param {string} [options.logoHref='/pages/landing.html'] - Logo link destination
 * @param {string} [options.logoText='PDF Service'] - Logo text
 * @param {Array} [options.actions=[]] - Action buttons array
 * @param {boolean} [options.showUserInfo=true] - Whether to show user info section
 * @param {string} [options.userAvatarId='userAvatar'] - ID for user avatar element
 * @param {string} [options.userNameId='userName'] - ID for user name element
 * @param {string} [options.logoutBtnId='logoutBtn'] - ID for logout button element
 * @param {string} [options.headerId='appHeader'] - ID for the header element
 * @returns {HTMLElement} The created header element
 * 
 * @example
 * // Basic usage with default options
 * const header = createHeader();
 * document.body.insertBefore(header, document.body.firstChild);
 * 
 * @example
 * // Custom actions
 * const header = createHeader({
 *   actions: [
 *     { text: 'Dashboard', href: '/pages/dashboard.html', class: 'btn-secondary' },
 *     { text: 'Profile', href: '/pages/profile.html', class: 'btn-secondary' },
 *     { text: 'Sign Out', id: 'logoutBtn', class: 'btn-danger', type: 'button' }
 *   ]
 * });
 */
function createHeader(options = {}) {
    const {
        logoHref = '/pages/landing.html',
        logoText = 'PDF Service',
        actions = [],
        showUserInfo = true,
        userAvatarId = 'userAvatar',
        userNameId = 'userName',
        logoutBtnId = 'logoutBtn',
        headerId = 'appHeader'
    } = options;

    // Create header element
    const header = document.createElement('header');
    header.className = 'header';
    header.id = headerId;
    header.setAttribute('role', 'banner');

    // Create navigation
    const nav = document.createElement('nav');
    nav.className = 'nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Main navigation');

    // Create logo
    const logo = document.createElement('a');
    logo.href = logoHref;
    logo.className = 'logo';
    logo.setAttribute('aria-label', 'PDF Service Home');
    logo.textContent = logoText;

    // Create burger menu button for mobile
    const burgerMenu = document.createElement('button');
    burgerMenu.className = 'burger-menu';
    burgerMenu.setAttribute('aria-label', 'Toggle navigation menu');
    burgerMenu.setAttribute('aria-expanded', 'false');
    
    // Create burger icon (3 lines)
    for (let i = 0; i < 3; i++) {
        const span = document.createElement('span');
        burgerMenu.appendChild(span);
    }

    // Create desktop user section (hidden on mobile)
    const navUserDesktop = document.createElement('div');
    navUserDesktop.className = 'nav-user nav-user-desktop';

    // User info section (if enabled)
    if (showUserInfo) {
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';

        const userAvatar = document.createElement('div');
        userAvatar.className = 'user-avatar';
        userAvatar.id = userAvatarId;
        userAvatar.setAttribute('aria-hidden', 'true');
        userAvatar.textContent = 'U';

        const userName = document.createElement('span');
        userName.className = 'user-name';
        userName.id = userNameId;
        userName.textContent = 'Loading...';

        userInfo.appendChild(userAvatar);
        userInfo.appendChild(userName);
        navUserDesktop.appendChild(userInfo);
    }

    // Create actions container for desktop
    const actionsContainerDesktop = document.createElement('div');
    actionsContainerDesktop.className = 'card-actions';
    actionsContainerDesktop.id = 'header-actions-desktop';

    // Helper function to create action buttons
    const createActionButton = (action, container) => {
        const isButton = action.type === 'button' || !action.href;
        
        if (isButton) {
            const button = document.createElement('button');
            button.className = `btn ${action.class || 'btn-secondary'}`;
            button.textContent = action.text;
            
            if (action.id) {
                button.id = action.id;
            }
            
            // Clone for mobile menu (avoid duplicate IDs)
            if (container.classList.contains('nav-menu-mobile') && action.id) {
                button.id = `${action.id}-mobile`;
            }
            
            if (action.onClick) {
                button.addEventListener('click', action.onClick);
            }
            
            if (action.ariaLabel) {
                button.setAttribute('aria-label', action.ariaLabel);
            }
            
            container.appendChild(button);
        } else {
            const link = document.createElement('a');
            link.href = action.href;
            link.className = `btn ${action.class || 'btn-secondary'}`;
            link.textContent = action.text;
            
            if (action.id) {
                link.id = action.id;
            }
            
            // Clone for mobile menu (avoid duplicate IDs)
            if (container.classList.contains('nav-menu-mobile') && action.id) {
                link.id = `${action.id}-mobile`;
            }
            
            if (action.ariaLabel) {
                link.setAttribute('aria-label', action.ariaLabel);
            }
            
            container.appendChild(link);
        }
    };

    // Add action buttons to desktop
    if (actions.length > 0) {
        actions.forEach(action => {
            createActionButton(action, actionsContainerDesktop);
        });
    } else {
        // Default actions if none provided
        if (showUserInfo) {
            // Add default logout button if no actions provided
            const logoutBtn = document.createElement('button');
            logoutBtn.id = logoutBtnId;
            logoutBtn.className = 'btn btn-danger';
            logoutBtn.textContent = 'Sign Out';
            logoutBtn.setAttribute('aria-label', 'Sign out of account');
            actionsContainerDesktop.appendChild(logoutBtn);
        }
    }

    navUserDesktop.appendChild(actionsContainerDesktop);

    // Create mobile menu (hidden on desktop)
    const navMenuMobile = document.createElement('div');
    navMenuMobile.className = 'nav-menu-mobile';
    navMenuMobile.id = 'nav-menu-mobile';

    // Add user info to mobile menu
    if (showUserInfo) {
        const userInfoMobile = document.createElement('div');
        userInfoMobile.className = 'user-info';

        const userAvatarMobile = document.createElement('div');
        userAvatarMobile.className = 'user-avatar';
        userAvatarMobile.setAttribute('aria-hidden', 'true');
        userAvatarMobile.id = `${userAvatarId}-mobile`;
        userAvatarMobile.textContent = 'U';

        const userNameMobile = document.createElement('span');
        userNameMobile.className = 'user-name';
        userNameMobile.id = `${userNameId}-mobile`;
        userNameMobile.textContent = 'Loading...';

        userInfoMobile.appendChild(userAvatarMobile);
        userInfoMobile.appendChild(userNameMobile);
        navMenuMobile.appendChild(userInfoMobile);
    }

    // Create actions container for mobile
    const actionsContainerMobile = document.createElement('div');
    actionsContainerMobile.className = 'card-actions';

    // Add action buttons to mobile
    if (actions.length > 0) {
        actions.forEach(action => {
            createActionButton(action, actionsContainerMobile);
        });
    } else {
        // Default actions if none provided
        if (showUserInfo) {
            const logoutBtnMobile = document.createElement('button');
            logoutBtnMobile.id = `${logoutBtnId}-mobile`;
            logoutBtnMobile.className = 'btn btn-danger';
            logoutBtnMobile.textContent = 'Sign Out';
            logoutBtnMobile.setAttribute('aria-label', 'Sign out of account');
            actionsContainerMobile.appendChild(logoutBtnMobile);
        }
    }

    navMenuMobile.appendChild(actionsContainerMobile);

    // Setup burger menu toggle
    const toggleMobileMenu = () => {
        const isActive = burgerMenu.classList.contains('active');
        burgerMenu.classList.toggle('active');
        navMenuMobile.classList.toggle('active');
        burgerMenu.setAttribute('aria-expanded', !isActive ? 'true' : 'false');
    };
    
    burgerMenu.addEventListener('click', toggleMobileMenu);
    
    // Close mobile menu when clicking on links only
    // Buttons handle their own actions (like logout) - don't interfere
    navMenuMobile.addEventListener('click', function(e) {
        // Only handle links, ignore buttons
        const clickedLink = e.target.tagName === 'A' || (e.target.closest && e.target.closest('a'));
        if (clickedLink && e.target.tagName !== 'BUTTON') {
            if (burgerMenu.classList.contains('active')) {
                toggleMobileMenu();
            }
        }
        // For buttons, do nothing - let their handlers execute
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (burgerMenu.classList.contains('active')) {
            // If clicking outside the header entirely
            if (!header.contains(e.target)) {
                toggleMobileMenu();
            }
        }
    });

    // Assemble navigation
    nav.appendChild(logo);
    nav.appendChild(navUserDesktop);
    nav.appendChild(burgerMenu);

    // Assemble header
    header.appendChild(nav);
    header.appendChild(navMenuMobile);

    return header;
}

/**
 * Load user data into header
 * Updates user avatar and name from localStorage or API
 * Updates both desktop and mobile versions
 * 
 * @param {string} [avatarId='userAvatar'] - ID of avatar element
 * @param {string} [nameId='userName'] - ID of name element
 */
async function loadHeaderUserData(avatarId = 'userAvatar', nameId = 'userName') {
    const updateUserDisplay = (user) => {
        // Helper to update a single element
        const updateElement = (el, text) => {
            if (el) el.textContent = text;
        };
        
        // Calculate initials and name
        let initials = 'U';
        let displayName = 'User';
        
        if (user.profile) {
            const firstName = user.profile.firstName || '';
            const lastName = user.profile.lastName || '';
            initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'U';
            
            if (firstName || lastName) {
                displayName = `${firstName} ${lastName}`.trim() || user.email || 'User';
            } else {
                displayName = user.email || 'User';
            }
        } else {
            displayName = user.email || 'User';
        }
        
        // Update desktop elements
        const avatarEl = document.getElementById(avatarId);
        updateElement(avatarEl, initials);
        
        const nameEl = document.getElementById(nameId);
        updateElement(nameEl, displayName);
        
        // Update mobile elements (if they exist)
        const avatarElMobile = document.getElementById(`${avatarId}-mobile`);
        updateElement(avatarElMobile, initials);
        
        const nameElMobile = document.getElementById(`${nameId}-mobile`);
        updateElement(nameElMobile, displayName);
    };
    
    try {
        // Try to get user data from localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            updateUserDisplay(user);
        } else {
            // If no user data, try to fetch from API
            const response = await fetch('/dashboard/profile', {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.user) {
                    const user = data.data.user;
                    localStorage.setItem('user', JSON.stringify(user));
                    updateUserDisplay(user);
                }
            }
        }
    } catch (error) {
        console.error('Error loading user data for header:', error);
    }
}

/**
 * Setup logout functionality
 * Handles both desktop and mobile logout buttons
 * 
 * @param {string} [logoutBtnId='logoutBtn'] - ID of logout button
 */
function setupHeaderLogout(logoutBtnId = 'logoutBtn') {
    const logoutHandler = async (e) => {
        // Prevent event bubbling to avoid conflicts
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        console.log('Logout button clicked'); // Debug log
        
        // Close mobile menu if open (for mobile logout button)
        const burgerMenu = document.querySelector('.burger-menu');
        if (burgerMenu && burgerMenu.classList.contains('active')) {
            burgerMenu.classList.remove('active');
            const navMenuMobile = document.querySelector('.nav-menu-mobile');
            if (navMenuMobile) {
                navMenuMobile.classList.remove('active');
            }
            burgerMenu.setAttribute('aria-expanded', 'false');
        }
        
        // Set a flag that we're logging out - this will persist for a few seconds
        sessionStorage.setItem('justLoggedOut', Date.now().toString());
        
        // Clear ALL localStorage and sessionStorage (but keep the logout flag)
        try {
            localStorage.clear();
            const logoutTimestamp = sessionStorage.getItem('justLoggedOut');
            sessionStorage.clear();
            // Restore logout timestamp
            if (logoutTimestamp) {
                sessionStorage.setItem('justLoggedOut', logoutTimestamp);
            }
            console.log('Storage cleared');
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
        
        // Clear cookies on client side - comprehensive clearing
        function clearAllCookies() {
            try {
                const cookies = document.cookie.split(";");
                const hostname = window.location.hostname;
                
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i];
                    const eqPos = cookie.indexOf("=");
                    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                    
                    // Try multiple ways to clear the cookie
                    // Method 1: Clear with path
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                    
                    // Method 2: Clear with domain (no leading dot)
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + hostname;
                    
                    // Method 3: Clear with domain (with leading dot)
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + hostname;
                    
                    // Method 4: Set to empty with maxAge 0
                    document.cookie = name + "=;max-age=0;path=/";
                    document.cookie = name + "=;max-age=0;path=/;domain=" + hostname;
                    document.cookie = name + "=;max-age=0;path=/;domain=." + hostname;
                }
                
                // Specifically target the session cookie
                const sessionCookieName = "pdf-service-session";
                document.cookie = sessionCookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                document.cookie = sessionCookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + hostname;
                document.cookie = sessionCookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + hostname;
                document.cookie = sessionCookieName + "=;max-age=0;path=/";
                document.cookie = sessionCookieName + "=;max-age=0;path=/;domain=" + hostname;
                document.cookie = sessionCookieName + "=;max-age=0;path=/;domain=." + hostname;
                
                console.log('Client-side cookies cleared');
            } catch (error) {
                console.error('Error clearing cookies:', error);
            }
        }
        
        clearAllCookies();
        
        try {
            console.log('Calling logout API...');
            const response = await fetch('/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Wait for logout to fully process
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Clear cookies again after API call
            clearAllCookies();
            
            // Redirect to login - the flag will prevent auto-login check
            window.location.replace('/pages/login.html');
        } catch (error) {
            console.error('Logout error:', error);
            // Clear cookies even if API call fails
            clearAllCookies();
            // Still redirect to login
            window.location.replace('/pages/login.html');
        }
    };
    
    // Wait a bit for DOM to be ready, then setup both direct and delegated handlers
    setTimeout(() => {
        // Use event delegation on the header to catch all logout button clicks
        // This works even if buttons are dynamically created
        const header = document.querySelector('.header');
        if (header) {
            header.addEventListener('click', function(e) {
                // Check if clicked element is a logout button (by ID)
                const clickedElement = e.target;
                const isDesktopLogout = clickedElement.id === logoutBtnId;
                const isMobileLogout = clickedElement.id === `${logoutBtnId}-mobile`;
                
                // Also check if clicking inside a logout button (for nested elements)
                const logoutBtnParent = clickedElement.closest(`#${logoutBtnId}, #${logoutBtnId}-mobile`);
                
                if (isDesktopLogout || isMobileLogout || logoutBtnParent) {
                    logoutHandler(e);
                }
            }, true); // Use capture phase to catch before other handlers
        }
        
        // Also attach directly to buttons if they exist
        const logoutBtn = document.getElementById(logoutBtnId);
        if (logoutBtn) {
            console.log('Desktop logout button found and handler attached');
            logoutBtn.addEventListener('click', logoutHandler, true);
        } else {
            console.warn('Desktop logout button not found');
        }
        
        const logoutBtnMobile = document.getElementById(`${logoutBtnId}-mobile`);
        if (logoutBtnMobile) {
            console.log('Mobile logout button found and handler attached');
            logoutBtnMobile.addEventListener('click', logoutHandler, true);
        } else {
            console.warn('Mobile logout button not found');
        }
    }, 100); // Small delay to ensure DOM is ready
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createHeader, loadHeaderUserData, setupHeaderLogout };
}

// Make available globally
window.HeaderComponent = {
    create: createHeader,
    loadUserData: loadHeaderUserData,
    setupLogout: setupHeaderLogout
};

