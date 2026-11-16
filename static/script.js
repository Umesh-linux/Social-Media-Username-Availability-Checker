/**
 * NameCheck – Social Media Username Availability Checker Using Hashing
 * Frontend Master Controller
 *
 * Covers:
 * 1. Admin Dashboard (9 Sections):
 *    - 1. Overview & Statistics
 *    - 2. Registered User Management (Role-based removal)
 *    - 3. Username Availability Analytics
 *    - 4. Live Algorithm Inspector (Dynamic backend calculations)
 *    - 5. Hash Table Execution Pipeline (O(1) Average complexity)
 *    - 6. Collision Resolution Visualization (h(k) = k mod 7 chaining)
 *    - 7. Performance Analytics (Load factor, occupied buckets, chain length)
 *    - 8. Database Management (SQLite metadata, seed demo data, clear logs)
 *    - 9. Admin Profile and Logout
 * 2. Public User Portal:
 *    - Username availability checker with real-time suggestions
 *    - User registration with Full Name, Email, Password verification, and Terms
 *    - User login with permission to remove own registered username
 */

document.addEventListener('DOMContentLoaded', () => {
    // =========================================================================
    // STATE & SESSION MANAGEMENT
    // =========================================================================
    let currentSession = null;
    let adminUnlocked = false;  // tracks whether admin gate has been passed
    try {
        const saved = localStorage.getItem('namecheck_session');
        if (saved) currentSession = JSON.parse(saved);
    } catch (e) {
        currentSession = null;
    }

    // =========================================================================
    // DOM REFERENCES
    // =========================================================================
    const toast = document.getElementById('toast');
    const viewAdminBtn = document.getElementById('viewAdminBtn');
    const viewUserBtn = document.getElementById('viewUserBtn');
    const adminViewContainer = document.getElementById('adminViewContainer');
    const userViewContainer = document.getElementById('userViewContainer');
    const authStatusBadge = document.getElementById('authStatusBadge');
    const authStatusText = document.getElementById('authStatusText');
    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    const adminTopLogoutBtn = document.getElementById('adminTopLogoutBtn');
    const userPortalTopLogoutBtn = document.getElementById('userPortalTopLogoutBtn');

    // Section 1: Overview
    const statIg = document.getElementById('stat-instagram');
    const statFb = document.getElementById('stat-facebook');
    const statX = document.getElementById('stat-x');
    const statIn = document.getElementById('stat-linkedin');
    const statTotal = document.getElementById('stat-total');
    const kpiTotalQueries = document.getElementById('kpi-total-queries');

    // Section 2: User Management
    const adminUsersCountBadge = document.getElementById('adminUsersCountBadge');
    const adminRefreshUsersBtn = document.getElementById('adminRefreshUsersBtn');
    const adminUsersTableBody = document.getElementById('adminUsersTableBody');

    // Section 3: Availability Analytics
    const availTotalQueries = document.getElementById('avail-total-queries');
    const availPct = document.getElementById('avail-pct');
    const availCountSub = document.getElementById('avail-count-sub');
    const takenPct = document.getElementById('taken-pct');
    const takenCountSub = document.getElementById('taken-count-sub');
    const topSearchedTableBody = document.getElementById('topSearchedTableBody');

    // Section 4: Live Algorithm Inspector
    const inspUsername = document.getElementById('insp-username');
    const inspHash = document.getElementById('insp-hash');
    const inspBucket = document.getElementById('insp-bucket');
    const inspCollision = document.getElementById('insp-collision');
    const inspProbes = document.getElementById('insp-probes');
    const inspSearchCount = document.getElementById('insp-search-count');
    const adminInspectInput = document.getElementById('adminInspectInput');
    const adminInspectBtn = document.getElementById('adminInspectBtn');

    // Section 6: Collision Visualization
    const adminRefreshVisualizerBtn = document.getElementById('adminRefreshVisualizerBtn');
    const adminVisualizeInput = document.getElementById('adminVisualizeInput');
    const adminTraceHashBtn = document.getElementById('adminTraceHashBtn');
    const traceReportBox = document.getElementById('traceReportBox');
    const traceTitle = document.getElementById('traceTitle');
    const traceCollisionBadge = document.getElementById('traceCollisionBadge');
    const traceDetails = document.getElementById('traceDetails');
    const bucketsDisplayGrid = document.getElementById('bucketsDisplayGrid');

    // Section 7: Performance Analytics
    const analyticsLoadFactor = document.getElementById('analytics-load-factor');
    const analyticsTotalEntries = document.getElementById('analytics-total-entries');
    const analyticsOccupiedBuckets = document.getElementById('analytics-occupied-buckets');
    const analyticsTotalCollisions = document.getElementById('analytics-total-collisions');
    const analyticsAvgChain = document.getElementById('analytics-avg-chain');
    const analyticsMaxChain = document.getElementById('analytics-max-chain');
    const analyticsTableBody = document.getElementById('analyticsTableBody');

    // Section 8: Database Management
    const adminSeedBtn = document.getElementById('adminSeedBtn');
    const adminClearHistoryBtn = document.getElementById('adminClearHistoryBtn');
    const dbSqliteVer = document.getElementById('dbSqliteVer');
    const dbUserCount = document.getElementById('dbUserCount');
    const dbHistoryCount = document.getElementById('dbHistoryCount');
    const adminHistoryTableBody = document.getElementById('adminHistoryTableBody');

    // Section 9: Profile & Logout
    const adminLogoutSectionBtn = document.getElementById('adminLogoutSectionBtn');

    // Public User Portal
    const userTabSearchBtn = document.getElementById('userTabSearchBtn');
    const userTabRegBtn = document.getElementById('userTabRegBtn');
    const userTabLoginBtn = document.getElementById('userTabLoginBtn');
    const userSearchPanel = document.getElementById('userSearchPanel');
    const userRegPanel = document.getElementById('userRegPanel');
    const userLoginPanel = document.getElementById('userLoginPanel');

    // Public Search Form
    const publicUsernameInput = document.getElementById('publicUsernameInput');
    const publicCheckBtn = document.getElementById('publicCheckBtn');
    const publicGoRegisterBtn = document.getElementById('publicGoRegisterBtn');
    const publicResultBox = document.getElementById('publicResultBox');
    const publicResultStatus = document.getElementById('publicResultStatus');
    const publicResultMessage = document.getElementById('publicResultMessage');
    const publicSuggestionsContainer = document.getElementById('publicSuggestionsContainer');
    const publicSuggestionsList = document.getElementById('publicSuggestionsList');

    // Public Registration Form
    const pubRegFullName = document.getElementById('pubRegFullName');
    const pubRegUsername = document.getElementById('pubRegUsername');
    const pubRegEmail = document.getElementById('pubRegEmail');
    const pubRegPlatform = document.getElementById('pubRegPlatform');
    const pubRegPassword = document.getElementById('pubRegPassword');
    const pubRegConfirmPassword = document.getElementById('pubRegConfirmPassword');
    const pubRegTerms = document.getElementById('pubRegTerms');
    const pubRegisterSubmitBtn = document.getElementById('pubRegisterSubmitBtn');
    const pubRegResultBox = document.getElementById('pubRegResultBox');
    const pubPasswordMatchHint = document.getElementById('pubPasswordMatchHint');

    // Public Login Form
    const pubFillUserDemoBtn = document.getElementById('pubFillUserDemoBtn');
    const pubLoginIdentifier = document.getElementById('pubLoginIdentifier');
    const pubLoginPassword = document.getElementById('pubLoginPassword');
    const pubLoginPlatform = document.getElementById('pubLoginPlatform');
    const pubLoginSubmitBtn = document.getElementById('pubLoginSubmitBtn');
    const pubLoginResultBox = document.getElementById('pubLoginResultBox');

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================
    const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    let toastTimer = null;
    const showToast = (message, type = 'info') => {
        if (!toast) return;
        if (toastTimer) clearTimeout(toastTimer);
        toast.className = `toast ${type} show`;
        toast.textContent = message;
        toastTimer = setTimeout(() => {
            toast.className = 'toast';
        }, 4000);
    };

    const updateAuthUI = () => {
        if (!currentSession) {
            authStatusText.innerHTML = '👤 Public Guest Mode';
            if (headerLogoutBtn) headerLogoutBtn.style.display = 'none';
            if (userPortalTopLogoutBtn) userPortalTopLogoutBtn.style.display = 'none';
        } else if (currentSession.role === 'admin') {
            authStatusText.innerHTML = `👑 Admin: <strong>${escapeHtml(currentSession.full_name)}</strong>`;
            if (headerLogoutBtn) {
                headerLogoutBtn.style.display = 'inline-flex';
                headerLogoutBtn.innerHTML = '🚪 Admin Logout';
            }
            if (userPortalTopLogoutBtn) {
                userPortalTopLogoutBtn.style.display = 'inline-flex';
                userPortalTopLogoutBtn.innerHTML = '🚪 Admin Logout';
            }
        } else {
            authStatusText.innerHTML = `👤 User: <strong>@${escapeHtml(currentSession.username)}</strong>`;
            if (headerLogoutBtn) {
                headerLogoutBtn.style.display = 'inline-flex';
                headerLogoutBtn.innerHTML = `🚪 Logout (@${escapeHtml(currentSession.username)})`;
            }
            if (userPortalTopLogoutBtn) {
                userPortalTopLogoutBtn.style.display = 'inline-flex';
                userPortalTopLogoutBtn.innerHTML = `🚪 Logout (@${escapeHtml(currentSession.username)})`;
            }
        }
    };

    // Admin Gate DOM references
    const adminGateLocked = document.getElementById('adminGateLocked');
    const adminContentUnlocked = document.getElementById('adminContentUnlocked');
    const adminGateLoginBtn = document.getElementById('adminGateLoginBtn');
    const adminGateUsername = document.getElementById('adminGateUsername');
    const adminGatePassword = document.getElementById('adminGatePassword');
    const adminGateErrorMsg = document.getElementById('adminGateErrorMsg');

    const showAdminGate = () => {
        // Show the login gate, hide the 9-section content
        if (adminGateLocked) adminGateLocked.classList.remove('hidden');
        if (adminContentUnlocked) adminContentUnlocked.classList.add('hidden');
    };

    const unlockAdminDashboard = () => {
        // Hide the login gate, show the 9-section content
        adminUnlocked = true;
        if (adminGateLocked) adminGateLocked.classList.add('hidden');
        if (adminContentUnlocked) adminContentUnlocked.classList.remove('hidden');
        loadAdminDashboardData();
    };

    const switchView = (mode) => {
        if (mode === 'admin') {
            adminViewContainer.classList.remove('hidden');
            adminViewContainer.classList.add('active-view');
            userViewContainer.classList.add('hidden');
            userViewContainer.classList.remove('active-view');
            viewAdminBtn.classList.add('active');
            viewUserBtn.classList.remove('active');

            // If admin is already authenticated this session, go straight in
            if (adminUnlocked && currentSession && currentSession.role === 'admin') {
                unlockAdminDashboard();
            } else {
                // Show the admin login gate
                showAdminGate();
            }
        } else {
            userViewContainer.classList.remove('hidden');
            userViewContainer.classList.add('active-view');
            adminViewContainer.classList.add('hidden');
            adminViewContainer.classList.remove('active-view');
            viewUserBtn.classList.add('active');
            viewAdminBtn.classList.remove('active');
        }
    };

    viewAdminBtn?.addEventListener('click', () => switchView('admin'));
    viewUserBtn?.addEventListener('click', () => switchView('user'));

    // Admin Gate Login Handler
    const handleAdminGateLogin = async () => {
        const username = adminGateUsername?.value.trim();
        const password = adminGatePassword?.value;

        if (!username || !password) {
            showToast('Please enter both username and password', 'error');
            return;
        }

        adminGateLoginBtn.disabled = true;
        adminGateLoginBtn.innerHTML = '<span>⏳</span> Verifying...';

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: username, password: password, platform: 'instagram' })
            });
            const data = await res.json();

            if (res.ok && data.success && data.user.role === 'admin') {
                // Admin verified — save session and unlock dashboard
                currentSession = data.user;
                localStorage.setItem('namecheck_session', JSON.stringify(currentSession));
                updateAuthUI();
                unlockAdminDashboard();
                showToast('Welcome, Administrator! Dashboard unlocked.', 'success');

                // Clear the password field so credentials are not visible anymore
                if (adminGatePassword) adminGatePassword.value = '';
                if (adminGateErrorMsg) adminGateErrorMsg.classList.add('hidden');
            } else {
                // Wrong credentials or not an admin account
                if (adminGateErrorMsg) {
                    adminGateErrorMsg.classList.remove('hidden');
                    adminGateErrorMsg.innerHTML = `
                        <div class="result-status"><span>❌</span> Authentication Failed</div>
                        <div class="result-message">${escapeHtml(data.error || 'Invalid credentials or not an administrator account.')}</div>
                    `;
                }
                showToast('Invalid admin credentials. Access denied.', 'error');
            }
        } catch (err) {
            showToast('Server connection failed', 'error');
        } finally {
            adminGateLoginBtn.disabled = false;
            adminGateLoginBtn.innerHTML = '<span>🔓</span> Unlock &amp; Enter Admin Dashboard';
        }
    };

    adminGateLoginBtn?.addEventListener('click', handleAdminGateLogin);
    adminGatePassword?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAdminGateLogin();
    });
    adminGateUsername?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') adminGatePassword?.focus();
    });

    const handleLogout = () => {
        localStorage.removeItem('namecheck_session');
        currentSession = null;
        adminUnlocked = false;  // lock admin gate again
        updateAuthUI();
        showToast('Logged out. Switched to Public Guest Mode.', 'info');
        // Reset admin gate UI for next login
        showAdminGate();
        if (adminGatePassword) adminGatePassword.value = '';
        if (adminGateErrorMsg) adminGateErrorMsg.classList.add('hidden');
        switchView('user');
    };

    headerLogoutBtn?.addEventListener('click', handleLogout);
    adminTopLogoutBtn?.addEventListener('click', handleLogout);
    userPortalTopLogoutBtn?.addEventListener('click', handleLogout);
    adminLogoutSectionBtn?.addEventListener('click', handleLogout);

    // Smooth scroll for Admin Navigation Links
    document.querySelectorAll('.admin-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElem = document.querySelector(targetId);
            if (targetElem) {
                targetElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });

    // Public portal subtab switching
    const switchUserSubTab = (panelName) => {
        userSearchPanel.classList.add('hidden');
        userRegPanel.classList.add('hidden');
        userLoginPanel.classList.add('hidden');
        userTabSearchBtn.classList.remove('active');
        userTabRegBtn.classList.remove('active');
        userTabLoginBtn.classList.remove('active');

        if (panelName === 'search') {
            userSearchPanel.classList.remove('hidden');
            userTabSearchBtn.classList.add('active');
        } else if (panelName === 'reg') {
            userRegPanel.classList.remove('hidden');
            userTabRegBtn.classList.add('active');
        } else if (panelName === 'login') {
            userLoginPanel.classList.remove('hidden');
            userTabLoginBtn.classList.add('active');
        }
    };

    userTabSearchBtn?.addEventListener('click', () => switchUserSubTab('search'));
    userTabRegBtn?.addEventListener('click', () => switchUserSubTab('reg'));
    userTabLoginBtn?.addEventListener('click', () => switchUserSubTab('login'));

    // =========================================================================
    // SECTION 1: ADMIN OVERVIEW & STATISTICS
    // =========================================================================
    const loadOverviewStats = async () => {
        try {
            const res = await fetch('/api/stats');
            const data = await res.json();
            if (statIg) statIg.textContent = data.platforms.instagram || 0;
            if (statFb) statFb.textContent = data.platforms.facebook || 0;
            if (statX) statX.textContent = data.platforms.x || 0;
            if (statIn) statIn.textContent = data.platforms.linkedin || 0;
            if (statTotal) statTotal.textContent = data.total_registered || 0;
            if (kpiTotalQueries) kpiTotalQueries.textContent = data.total_searches || 0;
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    // =========================================================================
    // SECTION 2: REGISTERED USER MANAGEMENT
    // =========================================================================
    const loadUsersDirectory = async () => {
        try {
            const roleParam = currentSession?.role || 'admin';
            const res = await fetch(`/api/users?role=${roleParam}`);
            const users = await res.json();

            if (adminUsersCountBadge) {
                adminUsersCountBadge.textContent = `${users.length} registered`;
            }

            if (!adminUsersTableBody) return;
            adminUsersTableBody.innerHTML = '';

            if (users.length === 0) {
                adminUsersTableBody.innerHTML = '<tr><td colspan="11" class="text-center empty-state">No users registered yet.</td></tr>';
                return;
            }

            users.forEach((u, idx) => {
                const tr = document.createElement('tr');
                const isCurrentAdmin = currentSession?.role === 'admin';
                const isSelf = currentSession && currentSession.id === u.id;
                const canDelete = isCurrentAdmin || isSelf;

                let actionButtonHtml = '';
                if (u.username === 'admin' && u.role === 'admin') {
                    actionButtonHtml = '<span class="badge-role admin">👑 Root Admin (Protected)</span>';
                } else if (canDelete) {
                    const verifyBtn = !u.email_verified && isCurrentAdmin
                        ? `<button type="button" class="btn btn-xs btn-outline-success verify-user-btn" data-id="${u.id}" data-username="${escapeHtml(u.username)}" title="Simulate email verification">✉️ Verify</button>`
                        : '';
                    actionButtonHtml = `
                        <div class="action-btn-group">
                            ${verifyBtn}
                            <button type="button" class="btn btn-xs btn-danger delete-user-btn" data-id="${u.id}" data-username="${escapeHtml(u.username)}" data-platform="${u.platform}" title="Remove user from SQLite & Hash Table">
                                🗑️ Remove
                            </button>
                        </div>
                    `;
                } else {
                    actionButtonHtml = '<span class="text-muted" style="font-size:0.75rem;">Protected</span>';
                }

                const roleBadge = u.role === 'admin'
                    ? '<span class="badge-role admin">👑 Admin</span>'
                    : '<span class="badge-role user">👤 User</span>';

                const statusBadge = u.email_verified
                    ? '<span class="badge-status available">✓ Verified</span>'
                    : '<span class="badge-status unavailable">Pending</span>';

                tr.innerHTML = `
                    <td>${idx + 1}</td>
                    <td><strong>${escapeHtml(u.full_name)}</strong></td>
                    <td><code class="username-pill">@${escapeHtml(u.username)}</code></td>
                    <td><small>${escapeHtml(u.email)}</small></td>
                    <td>${roleBadge}</td>
                    <td>${statusBadge}</td>
                    <td><span class="platform-badge ${u.platform}">${u.platform.toUpperCase()}</span></td>
                    <td><code class="code-sm">0x${Number(u.hash_code || 0).toString(16).toUpperCase()}</code></td>
                    <td><span class="badge-bucket">#${u.bucket_index || 0}</span></td>
                    <td><small>${escapeHtml(u.timestamp || 'N/A')}</small></td>
                    <td>${actionButtonHtml}</td>
                `;
                adminUsersTableBody.appendChild(tr);
            });

            // Wire up verify email buttons
            document.querySelectorAll('.verify-user-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const userId = btn.getAttribute('data-id');
                    const username = btn.getAttribute('data-username');
                    btn.disabled = true;
                    btn.textContent = '⏳...';

                    try {
                        const res = await fetch('/api/verify-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ user_id: userId })
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                            showToast(data.message, 'success');
                            loadUsersDirectory();
                            loadHistoryTable();
                        } else {
                            showToast(data.error || 'Failed to verify email', 'error');
                        }
                    } catch (e) {
                        showToast('Error verifying email', 'error');
                    }
                });
            });

            // Wire up delete buttons
            document.querySelectorAll('.delete-user-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const userId = btn.getAttribute('data-id');
                    const username = btn.getAttribute('data-username');
                    const platform = btn.getAttribute('data-platform');

                    if (!confirm(`Are you sure you want to remove @${username} from ${platform.toUpperCase()}? This frees the username back into the Hash Table.`)) {
                        return;
                    }

                    try {
                        const delRes = await fetch(`/api/users/${userId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                requester_role: currentSession?.role || 'admin',
                                requester_id: currentSession?.id || 1
                            })
                        });
                        const delData = await delRes.json();
                        if (delRes.ok && delData.success) {
                            showToast(delData.message, 'success');
                            loadAdminDashboardData();
                        } else {
                            showToast(delData.error || 'Failed to remove user', 'error');
                        }
                    } catch (e) {
                        showToast('Error removing user account', 'error');
                    }
                });
            });

        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    adminRefreshUsersBtn?.addEventListener('click', loadUsersDirectory);

    const adminRefreshUsersBtn2 = document.getElementById('adminRefreshUsersBtn2');
    adminRefreshUsersBtn2?.addEventListener('click', () => {
        loadUsersDirectory();
        showToast('User directory refreshed.', 'info');
    });

    const adminVerifyAllBtn = document.getElementById('adminVerifyAllBtn');
    adminVerifyAllBtn?.addEventListener('click', async () => {
        adminVerifyAllBtn.disabled = true;
        adminVerifyAllBtn.innerHTML = '<span>⏳</span> Verifying Emails...';

        try {
            const res = await fetch('/api/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: 'all' })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(data.message, 'success');
                loadUsersDirectory();
                loadHistoryTable();
            } else {
                showToast(data.error || 'Failed to verify pending emails', 'error');
            }
        } catch (e) {
            showToast('Server error verifying emails', 'error');
        } finally {
            adminVerifyAllBtn.disabled = false;
            adminVerifyAllBtn.innerHTML = '<span>✉️</span> Verify All Pending Emails';
        }
    });

    // =========================================================================
    // SECTION 3: USERNAME AVAILABILITY ANALYTICS
    // =========================================================================
    const loadAvailabilityAnalytics = async () => {
        try {
            const res = await fetch('/api/availability-analytics');
            const data = await res.json();

            if (availTotalQueries) availTotalQueries.textContent = data.total_searches || 0;
            if (availPct) availPct.textContent = `${data.available_pct || 0}%`;
            if (availCountSub) availCountSub.textContent = `${data.available_checks || 0} successful finds`;
            if (takenPct) takenPct.textContent = `${data.taken_pct || 0}%`;
            if (takenCountSub) takenCountSub.textContent = `${data.taken_checks || 0} conflicts detected`;

            if (topSearchedTableBody) {
                topSearchedTableBody.innerHTML = '';
                if (!data.top_searched || data.top_searched.length === 0) {
                    topSearchedTableBody.innerHTML = '<tr><td colspan="5" class="text-center empty-state">No queries recorded yet.</td></tr>';
                } else {
                    data.top_searched.forEach((item, index) => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td>#${index + 1}</td>
                            <td><code>@${escapeHtml(item.username)}</code></td>
                            <td><span class="platform-badge ${item.platform}">${item.platform.toUpperCase()}</span></td>
                            <td><strong>${item.frequency} times</strong></td>
                            <td><span class="badge-status ${item.frequency > 1 ? 'unavailable' : 'available'}">${item.frequency > 1 ? 'High Interest' : 'Standard'}</span></td>
                        `;
                        topSearchedTableBody.appendChild(tr);
                    });
                }
            }
        } catch (err) {
            console.error('Failed to load availability analytics:', err);
        }
    };

    // =========================================================================
    // SECTION 4: LIVE ALGORITHM INSPECTOR
    // =========================================================================
    const updateInspectorUI = (username, diag, searchCount) => {
        if (!inspUsername) return;
        inspUsername.innerHTML = `<code>@${escapeHtml(username)}</code>`;
        if (!diag) return;

        if (diag.hash_code !== undefined && inspHash) {
            inspHash.textContent = `0x${Number(diag.hash_code).toString(16).toUpperCase()} (${diag.hash_code})`;
        }
        if (diag.bucket_index !== undefined && inspBucket) {
            inspBucket.textContent = `Bucket #${diag.bucket_index} (mod ${diag.table_capacity || 10007})`;
        }
        if (inspCollision) {
            if (diag.collision) {
                inspCollision.innerHTML = `<span class="badge-status unavailable">Collision Detected (${diag.chain_length || 2} in bucket chain)</span>`;
            } else {
                inspCollision.innerHTML = `<span class="badge-status available">No Collision (Bucket Empty / Unique Node)</span>`;
            }
        }
        if (diag.probes !== undefined && inspProbes) {
            inspProbes.textContent = `${diag.probes} step(s) traversed`;
        }
        if (inspSearchCount) {
            inspSearchCount.textContent = `${searchCount || 1} time(s) queried across system`;
        }
    };

    const runAdminInspect = async () => {
        const username = adminInspectInput?.value.trim();
        if (!username) {
            showToast('Enter a username to inspect the live algorithm', 'error');
            adminInspectInput?.focus();
            return;
        }

        try {
            const res = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, platform: 'instagram' })
            });
            const data = await res.json();
            updateInspectorUI(username, data.diagnostics, data.search_count);
            showToast(`Inspected algorithm for @${username}: 0x${Number(data.diagnostics.hash_code).toString(16).toUpperCase()}`, 'info');
            loadAvailabilityAnalytics();
            loadHistoryTable();
        } catch (err) {
            showToast('Inspection failed', 'error');
        }
    };

    adminInspectBtn?.addEventListener('click', runAdminInspect);
    adminInspectInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runAdminInspect();
    });

    // =========================================================================
    // SECTION 6: COLLISION RESOLUTION VISUALIZATION (h(k) = k mod 7)
    // =========================================================================
    const loadVisualizerBuckets = async () => {
        try {
            const res = await fetch('/api/visualize');
            const data = await res.json();
            if (!bucketsDisplayGrid) return;
            bucketsDisplayGrid.innerHTML = '';

            const buckets = data.buckets || {};
            for (let i = 0; i < 7; i++) {
                const chain = buckets[i] || [];
                const bCard = document.createElement('div');
                bCard.className = `bucket-slot ${chain.length > 1 ? 'has-collision' : ''}`;
                bCard.id = `bucket-slot-${i}`;

                let nodesHtml = '';
                if (chain.length === 0) {
                    nodesHtml = '<div class="chain-empty">NULL (Empty Pointer)</div>';
                } else {
                    nodesHtml = chain.map((node, nIdx) => `
                        <div class="chain-node ${nIdx > 0 ? 'collision-node' : ''}" data-key="${escapeHtml(node.key)}">
                            <span class="node-arrow">↳</span>
                            <span class="node-key">@${escapeHtml(node.key)}</span>
                            <span class="node-owner">(${escapeHtml(node.full_name)})</span>
                        </div>
                    `).join('');
                }

                bCard.innerHTML = `
                    <div class="bucket-slot-header">
                        <span class="slot-idx">Bucket [${i}]</span>
                        <span class="slot-count badge-status ${chain.length > 1 ? 'unavailable' : 'available'}">${chain.length} node${chain.length === 1 ? '' : 's'}</span>
                    </div>
                    <div class="chain-nodes-container">
                        ${nodesHtml}
                    </div>
                `;
                bucketsDisplayGrid.appendChild(bCard);
            }
        } catch (err) {
            console.error('Failed to load visualizer buckets:', err);
        }
    };

    adminRefreshVisualizerBtn?.addEventListener('click', loadVisualizerBuckets);

    const runTraceVisualizer = async () => {
        const username = adminVisualizeInput?.value.trim();
        if (!username) {
            showToast('Enter a username to trace collision resolution', 'error');
            adminVisualizeInput?.focus();
            return;
        }

        try {
            const res = await fetch(`/api/visualize?username=${encodeURIComponent(username)}&platform=instagram`);
            const data = await res.json();
            const edu = data.edu_table;

            if (traceReportBox) {
                traceReportBox.classList.remove('hidden');
                traceTitle.textContent = `Traversal Trace for "@${escapeHtml(username)}"`;

                if (edu.collision) {
                    traceCollisionBadge.className = 'badge-status unavailable';
                    traceCollisionBadge.textContent = `Collision Detected (${edu.chain_length} nodes in Bucket #${edu.bucket_index})`;
                } else {
                    traceCollisionBadge.className = 'badge-status available';
                    traceCollisionBadge.textContent = `No Collision (Bucket #${edu.bucket_index})`;
                }

                let stepsHtml = `
                    <div class="trace-calc-summary">
                        <strong>Formula:</strong> <code>h('${escapeHtml(username)}') = ${edu.hash_code}</code> &rarr; <code>${edu.hash_code} mod 7 = Bucket #${edu.bucket_index}</code>
                    </div>
                    <div class="trace-steps-list">
                `;

                if (Array.isArray(edu.traversal_steps)) {
                    edu.traversal_steps.forEach(step => {
                        if (typeof step === 'string') {
                            stepsHtml += `<div class="trace-step-item">▪ ${escapeHtml(step)}</div>`;
                        } else {
                            stepsHtml += `
                                <div class="trace-step-item ${step.match ? 'match-step' : ''}">
                                    Step ${step.step}: Checked node <strong>@${escapeHtml(step.checked_key)}</strong> &rarr; ${step.match ? '🎯 MATCH FOUND!' : 'Mismatch, traversing to next pointer...'}
                                </div>
                            `;
                        }
                    });
                }
                stepsHtml += '</div>';
                traceDetails.innerHTML = stepsHtml;

                // Highlight bucket in grid
                document.querySelectorAll('.bucket-slot').forEach(b => b.classList.remove('highlight-bucket'));
                const targetBucket = document.getElementById(`bucket-slot-${edu.bucket_index}`);
                if (targetBucket) {
                    targetBucket.classList.add('highlight-bucket');
                    targetBucket.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        } catch (err) {
            showToast('Failed to trace collision', 'error');
        }
    };

    adminTraceHashBtn?.addEventListener('click', runTraceVisualizer);
    adminVisualizeInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runTraceVisualizer();
    });

    // =========================================================================
    // SECTION 7: PERFORMANCE ANALYTICS
    // =========================================================================
    const loadPerformanceAnalytics = async () => {
        try {
            const res = await fetch('/api/analytics');
            const data = await res.json();
            const summary = data.summary || {};
            const edu = data.educational_mod7 || {};
            const platforms = data.platforms || {};

            if (analyticsLoadFactor) analyticsLoadFactor.textContent = summary.global_load_factor || '0.00000';
            if (analyticsTotalEntries) analyticsTotalEntries.textContent = summary.total_registered_users || 0;
            if (analyticsOccupiedBuckets) analyticsOccupiedBuckets.textContent = summary.total_occupied_buckets || 0;
            if (analyticsTotalCollisions) analyticsTotalCollisions.textContent = summary.total_collisions || 0;
            if (analyticsAvgChain) analyticsAvgChain.textContent = edu.avg_chain_length || '0.00';
            if (analyticsMaxChain) analyticsMaxChain.textContent = edu.max_chain_length || 0;

            if (analyticsTableBody) {
                analyticsTableBody.innerHTML = '';
                Object.entries(platforms).forEach(([platform, m]) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><span class="platform-badge ${platform}">${platform.toUpperCase()}</span></td>
                        <td>${m.capacity.toLocaleString()}</td>
                        <td><strong>${m.total_entries}</strong></td>
                        <td>${m.occupied_buckets}</td>
                        <td>${m.total_collisions}</td>
                        <td><code>${m.load_factor}</code></td>
                        <td>${m.avg_chain_length}</td>
                        <td>${m.max_chain_length}</td>
                    `;
                    analyticsTableBody.appendChild(tr);
                });

                // Add Educational Modulo 7 table
                const eduTr = document.createElement('tr');
                eduTr.style.background = '#f8fafc';
                eduTr.innerHTML = `
                    <td><strong>🎓 Edu Mod 7</strong></td>
                    <td>${edu.capacity}</td>
                    <td><strong>${edu.total_entries}</strong></td>
                    <td>${edu.occupied_buckets}</td>
                    <td><strong style="color:#ef4444;">${edu.total_collisions}</strong></td>
                    <td><code>${edu.load_factor}</code></td>
                    <td>${edu.avg_chain_length}</td>
                    <td>${edu.max_chain_length}</td>
                `;
                analyticsTableBody.appendChild(eduTr);
            }
        } catch (err) {
            console.error('Failed to load performance analytics:', err);
        }
    };

    // =========================================================================
    // SECTION 8: DATABASE MANAGEMENT
    // =========================================================================
    const loadDbInfo = async () => {
        try {
            const res = await fetch('/api/db/info');
            const data = await res.json();
            if (dbSqliteVer) dbSqliteVer.textContent = data.sqlite_version || '3.x';
            if (dbUserCount) dbUserCount.textContent = data.total_user_records || 0;
            if (dbHistoryCount) dbHistoryCount.textContent = data.total_history_records || 0;
        } catch (err) {
            console.error('Failed to load DB info:', err);
        }
    };

    const loadHistoryTable = async () => {
        try {
            const res = await fetch('/api/history');
            const rows = await res.json();
            if (!adminHistoryTableBody) return;
            adminHistoryTableBody.innerHTML = '';

            if (rows.length === 0) {
                adminHistoryTableBody.innerHTML = '<tr><td colspan="9" class="text-center empty-state">No search history recorded yet.</td></tr>';
                return;
            }

            rows.forEach((r, idx) => {
                const tr = document.createElement('tr');
                const isAvail = r.status.includes('Available') || r.status.includes('Registered') || r.status.includes('Success');
                tr.innerHTML = `
                    <td>${idx + 1}</td>
                    <td><code>@${escapeHtml(r.username)}</code></td>
                    <td><span class="platform-badge ${r.platform}">${r.platform.toUpperCase()}</span></td>
                    <td><strong>${escapeHtml(r.action)}</strong></td>
                    <td><span class="badge-status ${isAvail ? 'available' : 'unavailable'}">${escapeHtml(r.status)}</span></td>
                    <td>${r.search_count}x</td>
                    <td><code class="code-sm">0x${Number(r.hash_code || 0).toString(16).toUpperCase()}</code></td>
                    <td><span class="badge-bucket">#${r.bucket_index || 0}</span></td>
                    <td><small>${escapeHtml(r.timestamp)}</small></td>
                `;
                adminHistoryTableBody.appendChild(tr);
            });
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    };

    adminSeedBtn?.addEventListener('click', async () => {
        adminSeedBtn.disabled = true;
        adminSeedBtn.innerHTML = '<span>⏳</span> Seeding...';
        try {
            const res = await fetch('/api/seed', { method: 'POST' });
            const data = await res.json();
            showToast(data.message, 'success');
            loadAdminDashboardData();
        } catch (err) {
            showToast('Failed to seed demo accounts', 'error');
        } finally {
            adminSeedBtn.disabled = false;
            adminSeedBtn.innerHTML = '<span>🌱</span> Seed 12 Demo Accounts';
        }
    });

    adminClearHistoryBtn?.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to clear the search audit history?')) return;
        try {
            const res = await fetch('/api/history/clear', { method: 'POST' });
            const data = await res.json();
            showToast(data.message, 'info');
            loadHistoryTable();
            loadDbInfo();
            loadAvailabilityAnalytics();
        } catch (err) {
            showToast('Failed to clear history', 'error');
        }
    });

    // Master function to reload all Admin Dashboard data
    const loadAdminDashboardData = () => {
        loadOverviewStats();
        loadUsersDirectory();
        loadAvailabilityAnalytics();
        loadVisualizerBuckets();
        loadPerformanceAnalytics();
        loadDbInfo();
        loadHistoryTable();
    };

    // =========================================================================
    // PUBLIC USER PORTAL: AVAILABILITY CHECKER
    // =========================================================================
    const getPublicSelectedPlatform = () => {
        const checked = document.querySelector('input[name="publicPlatform"]:checked');
        return checked ? checked.value : 'instagram';
    };

    const renderPublicSuggestions = (suggestions, platform) => {
        if (!publicSuggestionsList || !publicSuggestionsContainer) return;
        publicSuggestionsList.innerHTML = '';
        if (!suggestions || suggestions.length === 0) {
            publicSuggestionsContainer.classList.add('hidden');
            return;
        }

        suggestions.forEach(cand => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'suggestion-pill';
            btn.innerHTML = `<span>⚡ @${escapeHtml(cand)}</span>`;
            btn.addEventListener('click', () => {
                publicUsernameInput.value = cand;
                runPublicCheck();
            });
            publicSuggestionsList.appendChild(btn);
        });
        publicSuggestionsContainer.classList.remove('hidden');
    };

    const runPublicCheck = async () => {
        const username = publicUsernameInput?.value.trim();
        const platform = getPublicSelectedPlatform();

        if (!username) {
            showToast('Please enter a username to check', 'error');
            publicUsernameInput?.focus();
            return;
        }

        publicCheckBtn.disabled = true;
        publicCheckBtn.innerHTML = '<span>⏳</span> Checking...';

        try {
            const res = await fetch('/api/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, platform })
            });
            const data = await res.json();

            // Update live inspector on Admin view behind the scenes
            updateInspectorUI(username, data.diagnostics, data.search_count);

            if (publicResultBox) {
                publicResultBox.classList.remove('hidden');
                if (data.available) {
                    publicResultBox.className = 'result-box available';
                    publicResultStatus.innerHTML = `<span>✅</span> Available on ${platform.toUpperCase()}`;
                    publicResultMessage.innerHTML = `Great news! <strong>@${escapeHtml(username)}</strong> is completely available. Click <strong>"Register This Username"</strong> below to claim it now!`;
                    if (publicSuggestionsContainer) publicSuggestionsContainer.classList.add('hidden');
                    showToast(`@${username} is available on ${platform}!`, 'success');
                } else {
                    publicResultBox.className = 'result-box unavailable';
                    publicResultStatus.innerHTML = `<span>❌</span> Unavailable on ${platform.toUpperCase()}`;
                    const ownerText = data.taken_by ? ` (Registered by <strong>${escapeHtml(data.taken_by)}</strong>)` : '';
                    publicResultMessage.innerHTML = `Sorry, <strong>@${escapeHtml(username)}</strong> is already registered${ownerText}. Here are available suggestions:`;
                    renderPublicSuggestions(data.suggestions, platform);
                    showToast(`@${username} is taken on ${platform}`, 'error');
                }
            }
        } catch (err) {
            showToast('Availability check failed. Please check backend connection.', 'error');
        } finally {
            publicCheckBtn.disabled = false;
            publicCheckBtn.innerHTML = '<span>🔎</span> Check Availability';
        }
    };

    publicCheckBtn?.addEventListener('click', runPublicCheck);
    publicUsernameInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runPublicCheck();
    });

    publicGoRegisterBtn?.addEventListener('click', () => {
        const uname = publicUsernameInput?.value.trim();
        const plat = getPublicSelectedPlatform();
        if (!uname) {
            showToast('Enter a username first, then click register', 'error');
            publicUsernameInput?.focus();
            return;
        }

        pubRegUsername.value = uname;
        pubRegPlatform.value = plat;
        pubRegFullName.value = uname.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        pubRegEmail.value = `${uname.toLowerCase()}@example.com`;
        switchUserSubTab('reg');
        showToast('Complete your password and accept terms to register!', 'info');
    });

    // =========================================================================
    // PUBLIC USER PORTAL: REGISTRATION WITH COMPLETE FIELDS
    // =========================================================================
    const validatePasswordMatch = () => {
        if (!pubPasswordMatchHint) return;
        const p1 = pubRegPassword.value;
        const p2 = pubRegConfirmPassword.value;

        if (!p2) {
            pubPasswordMatchHint.textContent = 'Verify password';
            pubPasswordMatchHint.style.color = '#64748b';
        } else if (p1 === p2) {
            pubPasswordMatchHint.textContent = '✓ Passwords match';
            pubPasswordMatchHint.style.color = '#10b981';
        } else {
            pubPasswordMatchHint.textContent = '✗ Passwords do not match';
            pubPasswordMatchHint.style.color = '#ef4444';
        }
    };

    pubRegPassword?.addEventListener('input', validatePasswordMatch);
    pubRegConfirmPassword?.addEventListener('input', validatePasswordMatch);

    pubRegisterSubmitBtn?.addEventListener('click', async () => {
        const full_name = pubRegFullName.value.trim();
        const username = pubRegUsername.value.trim();
        const email = pubRegEmail.value.trim();
        const platform = pubRegPlatform.value;
        const password = pubRegPassword.value;
        const confirm_password = pubRegConfirmPassword.value;
        const terms = pubRegTerms.checked;

        if (!full_name) {
            showToast('Please enter your Full Name', 'error');
            pubRegFullName.focus();
            return;
        }
        if (!username) {
            showToast('Please choose a Username', 'error');
            pubRegUsername.focus();
            return;
        }
        if (!email) {
            showToast('Please enter a valid Email Address', 'error');
            pubRegEmail.focus();
            return;
        }
        if (!password) {
            showToast('Please enter a Password', 'error');
            pubRegPassword.focus();
            return;
        }
        if (password !== confirm_password) {
            showToast('Passwords do not match', 'error');
            pubRegConfirmPassword.focus();
            return;
        }
        if (!terms) {
            showToast('You must accept the Terms & Conditions', 'error');
            pubRegTerms.focus();
            return;
        }

        pubRegisterSubmitBtn.disabled = true;
        pubRegisterSubmitBtn.innerHTML = '<span>⏳</span> Registering Account...';

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name,
                    username,
                    email,
                    platform,
                    password,
                    confirm_password,
                    terms
                })
            });

            const data = await res.json();
            if (pubRegResultBox) pubRegResultBox.classList.remove('hidden');

            if (res.ok && data.success) {
                pubRegResultBox.className = 'result-box available';
                pubRegResultBox.innerHTML = `
                    <div class="result-status"><span>🎉</span> Registration Successful!</div>
                    <div class="result-message">
                        Congratulations <strong>${escapeHtml(full_name)}</strong>! Your username <strong>@${escapeHtml(username)}</strong> is officially registered on <strong>${platform.toUpperCase()}</strong>.
                        <br><small>Password securely hashed using Bcrypt (Cost 12).</small>
                    </div>
                `;
                showToast(`Registered @${username} successfully!`, 'success');

                // Set active session to the registered user
                currentSession = data.user;
                localStorage.setItem('namecheck_session', JSON.stringify(currentSession));
                updateAuthUI();

                // Clear fields
                pubRegPassword.value = '';
                pubRegConfirmPassword.value = '';

                // Reload admin datasets in background
                loadAdminDashboardData();
            } else {
                pubRegResultBox.className = 'result-box unavailable';
                pubRegResultBox.innerHTML = `
                    <div class="result-status"><span>⚠️</span> Registration Failed</div>
                    <div class="result-message">${escapeHtml(data.error || 'Failed to register')}</div>
                `;
                showToast(data.error || 'Registration failed', 'error');
            }
        } catch (err) {
            showToast('Server error during registration', 'error');
        } finally {
            pubRegisterSubmitBtn.disabled = false;
            pubRegisterSubmitBtn.innerHTML = '<span>🚀</span> Register Account &amp; Username';
        }
    });

    // =========================================================================
    // PUBLIC USER PORTAL: USER SIGN IN
    // =========================================================================
    pubFillUserDemoBtn?.addEventListener('click', () => {
        pubLoginIdentifier.value = 'alex_dev';
        pubLoginPassword.value = 'DemoPassword123!';
        pubLoginPlatform.value = 'instagram';
        showToast('Demo user credentials loaded!', 'info');
    });

    pubLoginSubmitBtn?.addEventListener('click', async () => {
        const identifier = pubLoginIdentifier.value.trim();
        const password = pubLoginPassword.value;
        const platform = pubLoginPlatform.value;

        if (!identifier || !password) {
            showToast('Please enter both username/email and password', 'error');
            return;
        }

        pubLoginSubmitBtn.disabled = true;
        pubLoginSubmitBtn.innerHTML = '<span>⏳</span> Signing In...';

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password, platform })
            });

            const data = await res.json();
            if (pubLoginResultBox) pubLoginResultBox.classList.remove('hidden');

            if (res.ok && data.success) {
                pubLoginResultBox.className = 'result-box available';
                pubLoginResultBox.innerHTML = `
                    <div class="result-status"><span>🔓</span> Welcome, ${escapeHtml(data.user.full_name)}!</div>
                    <div class="result-message">${escapeHtml(data.message)}</div>
                `;
                currentSession = data.user;
                localStorage.setItem('namecheck_session', JSON.stringify(currentSession));
                updateAuthUI();
                showToast(`Signed in as @${data.user.username}!`, 'success');

                if (currentSession.role === 'admin') {
                    setTimeout(() => switchView('admin'), 800);
                } else {
                    setTimeout(() => switchUserSubTab('search'), 800);
                }
            } else {
                pubLoginResultBox.className = 'result-box unavailable';
                pubLoginResultBox.innerHTML = `
                    <div class="result-status"><span>❌</span> Authentication Failed</div>
                    <div class="result-message">${escapeHtml(data.error || 'Invalid credentials')}</div>
                `;
                showToast(data.error || 'Login failed', 'error');
            }
        } catch (err) {
            showToast('Server connection failed', 'error');
        } finally {
            pubLoginSubmitBtn.disabled = false;
            pubLoginSubmitBtn.innerHTML = '<span>🔓</span> Sign In as Normal User';
        }
    });

    // =========================================================================
    // INITIALIZATION — Start on Public User Portal (Guest Mode)
    // =========================================================================
    updateAuthUI();
    // Default view is Public User Portal; admin gate blocks admin dashboard
    switchView('user');
});
