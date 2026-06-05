// Projects are now managed via Monday.com integration
// No hardcoded project data needed

// Storage keys
const STORAGE_KEY = 'workTrackerEntries';
const CLAIMED_HOURS_KEY = 'workTrackerClaimedHours';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    populateProjectDropdowns();
    setupEventListeners();
    setDefaultDate();
    updateAllViews();
    initializeMondayIntegration();
    setupDataManagement();
    
    // Don't fetch user info automatically - only load from localStorage
    const storedInfo = localStorage.getItem('mondayUserInfo');
    if (storedInfo) {
        try {
            const userInfo = JSON.parse(storedInfo);
            updateUserInfoDisplay(userInfo.name, userInfo.email);
        } catch (e) {
            console.error('Error parsing stored user info:', e);
        }
    }
}

// Navigation
function setupNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const viewName = this.dataset.view;
            switchView(viewName);
        });
    });
}

function switchView(viewName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewName);
    });
    
    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.toggle('active', view.id === `${viewName}-view`);
    });
    
    // Update content
    if (viewName === 'entries') {
        updateEntriesView();
    } else if (viewName === 'projects') {
        updateProjectsView();
    } else if (viewName === 'analytics') {
        updateAnalyticsView();
    } else if (viewName === 'monday') {
        displayMondayItems();
    } else if (viewName === 'settings') {
        initializeSyncHistory();
    }
}

// Populate dropdowns
function populateProjectDropdowns() {
    const projects = getProjectsData();
    const projectSelect = document.getElementById('projectSelect');
    const projectFilter = document.getElementById('projectFilter');
    const analyticsProjectFilter = document.getElementById('analyticsProjectFilter');
    
    projectSelect.innerHTML = '<option value="">-- Select Project --</option>';
    projectFilter.innerHTML = '<option value="">All projects</option>';
    analyticsProjectFilter.innerHTML = '<option value="">All Projects</option>';
    
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.account;
        option.textContent = `${project.account} - ${project.code}`;
        projectSelect.appendChild(option);
        
        const filterOption = option.cloneNode(true);
        projectFilter.appendChild(filterOption);
        
        const analyticsOption = option.cloneNode(true);
        analyticsProjectFilter.appendChild(analyticsOption);
    });
}

// Event listeners
function setupEventListeners() {
    // Modal controls
    document.getElementById('logWorkBtn').addEventListener('click', openModal);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    
    // Add Project button
    const addProjectBtn = document.getElementById('addProjectBtn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', () => openProjectModal());
    }
    
    // Project Modal controls
    const closeProjectModalBtn = document.getElementById('closeProjectModal');
    if (closeProjectModalBtn) {
        closeProjectModalBtn.addEventListener('click', closeProjectModal);
    }
    
    const cancelProjectBtn = document.getElementById('cancelProjectBtn');
    if (cancelProjectBtn) {
        cancelProjectBtn.addEventListener('click', closeProjectModal);
    }
    
    const projectForm = document.getElementById('projectForm');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectFormSubmit);
    }
    
    // Close project modal on outside click
    const projectModal = document.getElementById('projectModal');
    if (projectModal) {
        projectModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeProjectModal();
            }
        });
    }

    // Form
    document.getElementById('projectSelect').addEventListener('change', handleProjectSelection);
    document.getElementById('workForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('hoursToAdd').addEventListener('input', updatePendingDisplay);
    
    // Daily Hours Breakdown button
    document.getElementById('dailyHoursBtn').addEventListener('click', function() {
        const section = document.getElementById('dailyHoursSection');
        const startDate = document.getElementById('startDate').value;
        let endDate = document.getElementById('endDate').value;
        
        if (!startDate) {
            alert('Please select a start date first.');
            return;
        }
        
        // If no end date, use today
        if (!endDate) {
            const today = new Date();
            endDate = today.toISOString().split('T')[0];
        }
        
        if (section.style.display === 'none') {
            generateDailyHoursInputs(startDate, endDate);
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });

    // Search and filters
    document.getElementById('searchEntries').addEventListener('input', filterEntries);
    document.getElementById('statusFilter').addEventListener('change', filterEntries);
    document.getElementById('projectFilter').addEventListener('change', filterEntries);
    document.getElementById('entriesTimePeriod').addEventListener('change', filterEntries);
    document.getElementById('searchProjects').addEventListener('input', applyProjectFilters);
    document.getElementById('projectsTimePeriod').addEventListener('change', applyProjectFilters);
    document.getElementById('timePeriod').addEventListener('change', function() {
        const monthPickerGroup = document.getElementById('monthPickerGroup');
        if (this.value === 'custom-month') {
            monthPickerGroup.style.display = 'block';
            populateMonthPicker();
        } else {
            monthPickerGroup.style.display = 'none';
        }
        updateAnalyticsView();
    });
    
    const monthPicker = document.getElementById('monthPicker');
    if (monthPicker) {
        monthPicker.addEventListener('change', updateAnalyticsView);
    }
    
    document.getElementById('analyticsProjectFilter').addEventListener('change', updateAnalyticsView);
    document.getElementById('refreshAnalyticsBtn').addEventListener('click', async function() {
        // Show progress message
        showAnalyticsMessage('🔄 Refreshing analytics data...', 'progress');
        
        // Force complete refresh of analytics
        console.log('Refreshing analytics...');
        
        // Small delay to show the message
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
            updateAnalyticsView();
            generateAnalyticsVisualizations();
            
            // Show success message
            showAnalyticsMessage('✅ Analytics refreshed successfully!', 'success');
            
            // Hide message after 2 seconds
            setTimeout(() => {
                hideAnalyticsMessage();
            }, 2000);
        } catch (error) {
            console.error('Error refreshing analytics:', error);
            showAnalyticsMessage('❌ Error refreshing analytics', 'error');
            setTimeout(() => {
                hideAnalyticsMessage();
            }, 3000);
        }
    });
    
    // Clear analytics filters button
    const clearAnalyticsFiltersBtn = document.getElementById('clearAnalyticsFilters');
    if (clearAnalyticsFiltersBtn) {
        clearAnalyticsFiltersBtn.addEventListener('click', function() {
            document.getElementById('timePeriod').value = 'week';
            document.getElementById('analyticsProjectFilter').value = '';
            document.getElementById('monthPickerGroup').style.display = 'none';
            updateAnalyticsView();
        });
    }

    // Export
    document.getElementById('exportBtn').addEventListener('click', exportData);
    
    // Monday.com tab button
    const importBtn = document.getElementById('importMondayItems');
    if (importBtn) importBtn.addEventListener('click', importFromMonday);
    
    const clearMondayBtn = document.getElementById('clearMondayItems');
    if (clearMondayBtn) clearMondayBtn.addEventListener('click', clearMondayItems);
    
    // Monday.com search and sort
    const searchMondayItems = document.getElementById('searchMondayItems');
    if (searchMondayItems) {
        searchMondayItems.addEventListener('input', function() {
            mondayCurrentPage = 1; // Reset to first page on search
            const searchTerm = this.value;
            const sortBy = document.getElementById('sortMondayItems').value;
            displayMondayItems(searchTerm, sortBy);
        });
    }
    
    const sortMondayItems = document.getElementById('sortMondayItems');
    if (sortMondayItems) {
        sortMondayItems.addEventListener('change', function() {
            mondayCurrentPage = 1; // Reset to first page on sort change
            const searchTerm = document.getElementById('searchMondayItems').value;
            const sortBy = this.value;
            displayMondayItems(searchTerm, sortBy);
        });
    }
    
    // Close modal on outside click
    document.getElementById('logWorkModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
}
// Generate daily hours input fields
function generateDailyHoursInputs(startDateStr, endDateStr) {
    const container = document.getElementById('dailyHoursInputs');
    container.innerHTML = '';
    
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    // Calculate number of days
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // Create input for each day
    for (let i = 0; i < diffDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + i);
        
        const dateStr = currentDate.toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: '2-digit', 
            month: 'short' 
        });
        
        const row = document.createElement('div');
        row.className = 'daily-hour-row';
        row.innerHTML = `
            <label>${dateStr}</label>
            <input type="number" 
                   class="daily-hour-input" 
                   data-date="${currentDate.toISOString().split('T')[0]}"
                   min="0" 
                   step="0.5" 
                   value="0"
                   placeholder="Hours">
            <span class="daily-hour-label">hours</span>
        `;
        
        container.appendChild(row);
    }
    
    // Add event listeners to update total
    const inputs = container.querySelectorAll('.daily-hour-input');
    inputs.forEach(input => {
        input.addEventListener('input', updateDailyHoursTotal);
    });
    
    updateDailyHoursTotal();
}

// Update daily hours total
function updateDailyHoursTotal() {
    const inputs = document.querySelectorAll('.daily-hour-input');
    let total = 0;
    
    inputs.forEach(input => {
        const value = parseFloat(input.value) || 0;
        total += value;
    });
    
    document.getElementById('dailyHoursTotal').textContent = total.toFixed(1);
    document.getElementById('hoursToAdd').value = total.toFixed(1);
}

// Modal functions
function openModal(entryId = null) {
    if (entryId) {
        // Edit mode
        const entries = getWorkEntries();
        const entry = entries.find(e => e.id === entryId);
        if (entry) {
            populateFormForEdit(entry);
        }
    } else {
        // Add mode
        document.getElementById('modalTitle').textContent = 'Log Work Task';
        document.getElementById('submitBtn').textContent = 'Add Task';
        document.getElementById('editEntryId').value = '';
        document.getElementById('commentsHistory').style.display = 'none';
    }
    document.getElementById('logWorkModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('logWorkModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('workForm').reset();
    clearFormFields();
    document.getElementById('editEntryId').value = '';
    document.getElementById('commentsHistory').style.display = 'none';
}

function populateFormForEdit(entry) {
    document.getElementById('modalTitle').textContent = 'Edit Work Task';
    document.getElementById('submitBtn').textContent = 'Update Task';
    document.getElementById('editEntryId').value = entry.id;
    
    // Populate form fields
    document.getElementById('projectSelect').value = entry.project;
    handleProjectSelection({ target: { value: entry.project } });
    
    document.getElementById('workTitle').value = entry.title;
    document.getElementById('workDescription').value = entry.description;
    document.getElementById('startDate').value = entry.startDate;
    document.getElementById('endDate').value = entry.endDate || '';
    document.getElementById('hoursToAdd').value = entry.hoursAdded;
    document.getElementById('entryStatus').value = entry.status;
    
    // Show comments history
    if (entry.commentsHistory && entry.commentsHistory.length > 0) {
        document.getElementById('commentsHistory').style.display = 'block';
        const historyHtml = entry.commentsHistory.map(comment => `
            <div class="comment-item">
                <div class="comment-date">${formatDate(comment.date)}</div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `).join('');
        document.getElementById('previousComments').innerHTML = historyHtml;
    }
}

// Project selection and auto-populate
function handleProjectSelection(e) {
    const selectedAccount = e.target.value;
    
    if (!selectedAccount) {
        clearFormFields();
        return;
    }
    
    const projects = getProjectsData();
    const project = projects.find(p => p.account === selectedAccount);
    
    if (project) {
        document.getElementById('code').value = project.code;
        document.getElementById('manager').value = project.manager;
        document.getElementById('product').value = project.product;
        document.getElementById('projectStatus').value = project.status;
        document.getElementById('totalHoursField').value = project.totalHours;
        
        const claimed = getClaimedHours(selectedAccount);
        document.getElementById('alreadyClaimed').value = claimed;
        document.getElementById('pendingHours').value = project.totalHours - claimed;
    }
}

function updatePendingDisplay() {
    const totalHours = parseFloat(document.getElementById('totalHoursField').value) || 0;
    const claimed = parseFloat(document.getElementById('alreadyClaimed').value) || 0;
    const toAdd = parseFloat(document.getElementById('hoursToAdd').value) || 0;
    
    const newPending = totalHours - claimed - toAdd;
    document.getElementById('pendingHours').value = newPending;
    
    if (toAdd > (totalHours - claimed)) {
        showAlert('warning', `Hours exceed available pending hours (${totalHours - claimed})`);
    }
}

// Form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    const editEntryId = document.getElementById('editEntryId').value;
    const isEdit = editEntryId !== '';
    
    const newComment = document.getElementById('comments').value.trim();
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const entryStatus = document.getElementById('entryStatus').value;
    
    // Validate end date for completed entries
    if (entryStatus === 'Completed' && !endDate) {
        showAlert('error', 'End date is required for completed tasks');
        return;
    }
    
    if (isEdit) {
        // Edit existing entry
        const entries = getWorkEntries();
        const entryIndex = entries.findIndex(e => e.id == editEntryId);
        
        if (entryIndex !== -1) {
            const oldEntry = entries[entryIndex];
            const oldHours = oldEntry.hoursAdded;
            const newHours = parseFloat(document.getElementById('hoursToAdd').value);
            
            // Update entry
            entries[entryIndex] = {
                ...oldEntry,
                title: document.getElementById('workTitle').value,
                description: document.getElementById('workDescription').value,
                startDate: startDate,
                endDate: endDate,
                hoursAdded: newHours,
                status: document.getElementById('entryStatus').value,
                lastModified: new Date().toISOString()
            };
            
            // Update comments history
            if (newComment) {
                if (!entries[entryIndex].commentsHistory) {
                    entries[entryIndex].commentsHistory = [];
                }
                entries[entryIndex].commentsHistory.push({
                    date: new Date().toISOString(),
                    text: newComment
                });
            }
            
            // Update hours if changed
            if (oldHours !== newHours) {
                const hoursDiff = newHours - oldHours;
                updateClaimedHours(oldEntry.project, hoursDiff);
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
            showAlert('success', 'Task updated successfully!');
        }
    } else {
        // Add new entry
        const formData = {
            id: Date.now(),
            project: document.getElementById('projectSelect').value,
            code: document.getElementById('code').value,
            manager: document.getElementById('manager').value,
            product: document.getElementById('product').value,
            projectStatus: projectStatus,
            totalHours: parseFloat(document.getElementById('totalHoursField').value),
            title: document.getElementById('workTitle').value,
            description: document.getElementById('workDescription').value,
            startDate: startDate,
            endDate: endDate,
            hoursAdded: parseFloat(document.getElementById('hoursToAdd').value),
            status: document.getElementById('entryStatus').value,
            commentsHistory: newComment ? [{ date: new Date().toISOString(), text: newComment }] : [],
            timestamp: new Date().toISOString()
        };
        
        // Validate hours
        const claimed = getClaimedHours(formData.project);
        const pending = formData.totalHours - claimed;
        
        if (formData.hoursAdded > pending) {
            showAlert('error', `Cannot add ${formData.hoursAdded} hours. Only ${pending} hours pending.`);
            return;
        }
        
        // Save entry
        saveWorkEntry(formData);
        updateClaimedHours(formData.project, formData.hoursAdded);
        
        showAlert('success', `Work task added! ${formData.hoursAdded} hours claimed for ${formData.project}.`);
    }
    
    closeModal();
    updateAllViews();
}

// Storage functions
function saveWorkEntry(entry) {
    const entries = getWorkEntries();
    entries.push(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getWorkEntries() {
    const entries = localStorage.getItem(STORAGE_KEY);
    return entries ? JSON.parse(entries) : [];
}

function getClaimedHours(project) {
    const claimedHours = localStorage.getItem(CLAIMED_HOURS_KEY);
    const hoursData = claimedHours ? JSON.parse(claimedHours) : {};
    return hoursData[project] || 0;
}

function updateClaimedHours(project, hoursToAdd) {
    const claimedHours = localStorage.getItem(CLAIMED_HOURS_KEY);
    const hoursData = claimedHours ? JSON.parse(claimedHours) : {};
    hoursData[project] = (hoursData[project] || 0) + hoursToAdd;
    localStorage.setItem(CLAIMED_HOURS_KEY, JSON.stringify(hoursData));
}

function deleteEntry(id) {
    if (!confirm('Delete this task?')) return;
    
    const entries = getWorkEntries();
    const entry = entries.find(e => e.id === id);
    
    if (entry) {
        // Update claimed hours
        const claimedHours = localStorage.getItem(CLAIMED_HOURS_KEY);
        const hoursData = claimedHours ? JSON.parse(claimedHours) : {};
        hoursData[entry.project] = Math.max(0, (hoursData[entry.project] || 0) - entry.hoursAdded);
        localStorage.setItem(CLAIMED_HOURS_KEY, JSON.stringify(hoursData));
        
        // Remove entry
        const updatedEntries = entries.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
        
        showAlert('success', 'Task deleted successfully!');
        updateAllViews();
    }
}

// Update views
function updateAllViews() {
    updateEntriesView();
    updateProjectsView();
    updateAnalyticsView();
}

function updateEntriesView() {
    const entries = getWorkEntries();
    
    // Update stats
    document.getElementById('totalEntries').textContent = entries.length;
    
    const totalClaimed = entries.reduce((sum, e) => sum + e.hoursAdded, 0);
    document.getElementById('totalClaimed').textContent = totalClaimed.toFixed(1);
    
    const completedCount = entries.filter(e => e.status === 'Completed').length;
    document.getElementById('completedProjects').textContent = completedCount;
    
    // Update table
    const tbody = document.getElementById('entriesTableBody');
    
    if (entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><h3>No tasks yet</h3><p>Click "Log work" to add your first task</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = entries.reverse().map(entry => `
        <tr>
            <td>
                <div class="account-cell">${entry.project}</div>
                <div class="code-cell">${entry.code}</div>
            </td>
            <td>
                <div class="title-cell">${entry.title}</div>
                <div class="description-cell">${entry.description}</div>
            </td>
            <td>${formatDate(entry.startDate)}</td>
            <td>${entry.endDate ? formatDate(entry.endDate) : '-'}</td>
            <td><strong>${entry.hoursAdded}</strong></td>
            <td><span class="status-badge status-${entry.status.toLowerCase().replace(' ', '-')}">${entry.status}</span></td>
            <td class="action-buttons">
                <button class="icon-btn" onclick="editEntry(${entry.id})" title="Edit">✏️</button>
                <button class="icon-btn" onclick="deleteEntry(${entry.id})" title="Delete">🗑️</button>
            </td>
        </tr>
    `).join('');
}

function updateProjectsView() {
    let projects = getProjectsData();
    let projectsUpdated = false;
    
    // Auto-update project statuses based on end date
    projects = projects.map(project => {
        const autoStatus = getAutoStatus(project.endDate, project.status);
        if (autoStatus !== project.status) {
            project.status = autoStatus;
            projectsUpdated = true;
        }
        return project;
    });
    
    // Save if any statuses were auto-updated
    if (projectsUpdated) {
        saveProjectsData(projects);
    }
    
    // Calculate totals
    let totalHours = 0;
    let totalClaimed = 0;
    
    projects.forEach(project => {
        totalHours += project.totalHours;
        totalClaimed += getClaimedHours(project.account);
    });
    
    const totalPending = totalHours - totalClaimed;
    const claimedPercentage = totalHours > 0 ? (totalClaimed / totalHours * 100) : 0;
    
    // Update stats
    document.getElementById('totalProjects').textContent = projects.length;
    document.getElementById('totalHours').textContent = totalHours;
    document.getElementById('projectsClaimed').textContent = totalClaimed.toFixed(1);
    document.getElementById('projectsPending').textContent = totalPending.toFixed(1);
    
    // Update progress bar in the highlighted stat card
    const progressFill = document.querySelector('.project-stat-box.highlighted .stat-box-progress-fill');
    const progressText = document.querySelector('.project-stat-box.highlighted .stat-box-progress-text');
    if (progressFill) {
        progressFill.style.width = claimedPercentage + '%';
    }
    if (progressText) {
        progressText.textContent = claimedPercentage.toFixed(1) + '% of total hours';
    }
    
    // Update table
    const tbody = document.getElementById('projectsTableBody');
    tbody.innerHTML = projects.map((project, index) => {
        const claimed = getClaimedHours(project.account);
        const pending = project.totalHours - claimed;
        const progress = project.totalHours > 0 ? (claimed / project.totalHours * 100) : 0;
        const duration = calculateDuration(project.startDate, project.endDate);
        const alerts = generateProjectAlerts(project, claimed, pending);
        const statusBadge = getStatusBadge(project.status);
        
        return `
            <tr class="project-row" data-project-id="${index}">
                <td class="expand-cell">
                    <button class="expand-btn" onclick="toggleProjectDetails(${index})" title="Expand details">
                        <span class="expand-icon">▶</span>
                    </button>
                </td>
                <td>${index + 1}</td>
                <td><strong>${project.account}</strong></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <strong>${progress.toFixed(0)}%</strong>
                        <div class="progress-container" style="flex: 1;">
                            <div class="progress-bar-wrapper">
                                <div class="progress-bar-fill" style="width: ${progress}%"></div>
                            </div>
                        </div>
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td><strong>${duration}</strong></td>
                <td>${alerts}</td>
                <td class="action-buttons">
                    <button class="icon-btn" onclick="editProject('${project.account}')" title="Edit">✏️</button>
                    <button class="icon-btn" onclick="deleteProject('${project.account}')" title="Delete">🗑️</button>
                </td>
            </tr>
            <tr class="project-details" id="details-${index}" style="display: none;">
                <td colspan="8">
                    <div class="details-content-professional">
                        <div class="details-row-1">
                            <div class="detail-inline">
                                <span class="detail-label">Product:</span>
                                <span class="detail-value">${project.product}</span>
                            </div>
                            <div class="detail-inline">
                                <span class="detail-label">Manager:</span>
                                <span class="detail-value">${project.manager}</span>
                            </div>
                            <div class="detail-inline">
                                <span class="detail-label">Window:</span>
                                <span class="detail-value">${project.startDate} → ${project.endDate}</span>
                            </div>
                        </div>
                        <div class="details-row-2">
                            <div class="detail-inline">
                                <span class="detail-label">Total Hours:</span>
                                <span class="detail-value"><strong>${project.totalHours}</strong></span>
                            </div>
                            <div class="detail-inline">
                                <span class="detail-label">Claimed:</span>
                                <span class="detail-value" style="color: var(--success-color);"><strong>${claimed.toFixed(1)}</strong></span>
                            </div>
                            <div class="detail-inline">
                                <span class="detail-label">Available:</span>
                                <span class="detail-value" style="color: var(--danger-color);"><strong>${pending.toFixed(1)}</strong></span>
                            </div>
                        </div>
                        <div class="details-row-3">
                            <div class="progress-section">
                                <div class="progress-header">
                                    <span class="detail-label">Claimed %:</span>
                                    <span class="progress-percentage-text">${progress.toFixed(0)}%</span>
                                </div>
                                <div class="progress-bar-wrapper-large">
                                    <div class="progress-bar-fill" style="width: ${progress}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Initialize dynamic filters (only once)
    initializeDynamicFilters();

// Toggle project details expansion
function toggleProjectDetails(projectId) {
    const detailsRow = document.getElementById('details-' + projectId);
    const expandBtn = document.querySelector('[data-project-id="' + projectId + '"] .expand-icon');
    
    if (detailsRow.style.display === 'none') {
        detailsRow.style.display = 'table-row';
        expandBtn.textContent = '▼';
    } else {
        detailsRow.style.display = 'none';
        expandBtn.textContent = '▶';
    }
}

// Make function globally available
window.toggleProjectDetails = toggleProjectDetails;

}


// Auto-update status based on end date
function getAutoStatus(endDateStr, currentStatus) {
    if (!endDateStr) {
        return currentStatus;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse DD-MM-YY format
    const parts = endDateStr.split('-');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        let year = parseInt(parts[2]);
        if (year < 100) {
            year += 2000;
        }
        const endDate = new Date(year, month, day);
        endDate.setHours(0, 0, 0, 0);
        
        // If end date has passed, mark as Deactive
        // If currently Deactive but end date is in future, reactivate
        if (endDate < today && currentStatus === 'Active') {
            return 'Deactive';
        } else if (endDate >= today && currentStatus === 'Deactive') {
            return 'Active';
        }
    }
    
    return currentStatus;
}

// Generate status badge
function getStatusBadge(status) {
    // Handle undefined, null, or empty status
    if (!status || status.trim() === '') {
        status = 'Active'; // Default to Active if status is missing
    }
    const statusClass = status.toLowerCase().replace(' ', '-');
    return `<span class="status-badge status-${statusClass}">${status}</span>`;
}

// Generate project alerts
function generateProjectAlerts(project, claimed, pending) {
    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!project.endDate) {
        return '<span class="alert-badge alert-info">ℹ️ No end date</span>';
    }
    
    // Parse end date
    const parts = project.endDate.split('-');
    if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1;
        let year = parseInt(parts[2]);
        if (year < 100) {
            year += 2000;
        }
        const endDate = new Date(year, month, day);
        endDate.setHours(0, 0, 0, 0);
        
        // Calculate days until end date
        const diffTime = endDate - today;
        const daysUntilEnd = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Check if end date has passed
        if (daysUntilEnd < 0) {
            alerts.push('<span class="alert-badge alert-danger">⚠️ Project ended</span>');
        }
        // Check if nearing end date (less than 30 days)
        else if (daysUntilEnd <= 30 && daysUntilEnd > 0) {
            alerts.push(`<span class="alert-badge alert-warning">⏰ ${daysUntilEnd} days left</span>`);
        }
    }
    
    // Check if hours are running low (less than 20% remaining)
    if (project.totalHours > 0) {
        const percentRemaining = (pending / project.totalHours) * 100;
        if (percentRemaining < 20 && pending > 0) {
            alerts.push('<span class="alert-badge alert-warning">📉 Low hours</span>');
        } else if (pending <= 0) {
            alerts.push('<span class="alert-badge alert-danger">🚫 No hours left</span>');
        }
    }
    
    // If no alerts, show OK status
    if (alerts.length === 0) {
        return '<span class="alert-badge alert-success">✅ OK</span>';
    }
    
    return alerts.join(' ');
}

// Calculate duration between two dates
function calculateDuration(startDateStr, endDateStr) {
    if (!endDateStr) {
        return '-';
    }
    
    // Parse DD-MM-YY format
    const parseDate = (dateStr) => {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
            let year = parseInt(parts[2]);
            if (year < 100) {
                year += 2000;
            }
            return new Date(year, month, day);
        }
        return null;
    };
    
    const endDate = parseDate(endDateStr);
    
    if (!endDate) {
        return '-';
    }
    
    // Calculate difference from TODAY to end date
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Format based on duration
    if (diffDays < 0) {
        // Project has ended
        const absDays = Math.abs(diffDays);
        if (absDays === 0) {
            return '<span style="color: var(--danger-color);">Ended today</span>';
        } else if (absDays < 30) {
            return `<span style="color: var(--danger-color);">Ended ${absDays}d ago</span>`;
        } else if (absDays < 365) {
            const months = Math.floor(absDays / 30);
            const days = absDays % 30;
            return `<span style="color: var(--danger-color);">Ended ${months}m ${days}d ago</span>`;
        } else {
            const years = Math.floor(absDays / 365);
            const months = Math.floor((absDays % 365) / 30);
            return `<span style="color: var(--danger-color);">Ended ${years}y ${months}m ago</span>`;
        }
    } else if (diffDays === 0) {
        return '<span style="color: var(--warning-color);">Ends today</span>';
    } else if (diffDays < 7) {
        return `<span style="color: var(--warning-color);">${diffDays} days</span>`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        const remainingDays = diffDays % 7;
        if (remainingDays === 0) {
            return weeks === 1 ? '1 week' : `${weeks} weeks`;
        } else {
            return `${weeks}w ${remainingDays}d`;
        }
    } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        const remainingDays = diffDays % 30;
        if (remainingDays === 0) {
            return months === 1 ? '1 month' : `${months} months`;
        } else if (remainingDays < 7) {
            return `${months}m ${remainingDays}d`;
        } else {
            const weeks = Math.floor(remainingDays / 7);
            return `${months}m ${weeks}w`;
        }
    } else {
        const years = Math.floor(diffDays / 365);
        const remainingMonths = Math.floor((diffDays % 365) / 30);
        if (remainingMonths === 0) {
            return years === 1 ? '1 year' : `${years} years`;
        } else {
            return `${years}y ${remainingMonths}m`;
        }
    }
}

// Helper function to check if date is in time period
function isDateInPeriod(dateStr, period) {
    if (period === 'all') return true;
    
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const startOfQuarter = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    switch(period) {
        case 'week':
            return date >= startOfWeek;
        case 'month':
            return date >= startOfMonth && date <= endOfMonth;
        case 'custom-month':
            const monthPicker = document.getElementById('monthPicker');
            if (monthPicker && monthPicker.value) {
                const [year, month] = monthPicker.value.split('-');
                const customStart = new Date(parseInt(year), parseInt(month) - 1, 1);
                const customEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
                return date >= customStart && date <= customEnd;
            }
            return date >= startOfMonth && date <= endOfMonth;
        case 'quarter':
            return date >= startOfQuarter;
        case 'year':
            return date >= startOfYear;
        default:
            return true;
    }
}

// Filter functions
function filterEntries() {
    const searchTerm = document.getElementById('searchEntries').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const projectFilter = document.getElementById('projectFilter').value;
    const timePeriod = document.getElementById('entriesTimePeriod').value;
    
    const entries = getWorkEntries();
    const rows = document.querySelectorAll('#entriesTableBody tr');
    
    rows.forEach((row, index) => {
        if (row.querySelector('.empty-state')) return;
        
        const entry = entries[entries.length - 1 - index]; // reversed in display
        if (!entry) return;
        
        const text = row.textContent.toLowerCase();
        const matchesSearch = text.includes(searchTerm);
        const matchesStatus = !statusFilter || text.includes(statusFilter.toLowerCase());
        const matchesProject = !projectFilter || text.includes(projectFilter.toLowerCase());
        const matchesPeriod = isDateInPeriod(entry.startDate, timePeriod);
        
        row.style.display = (matchesSearch && matchesStatus && matchesProject && matchesPeriod) ? '' : 'none';
    });
}

function filterProjects() {
    const searchTerm = document.getElementById('searchProjects').value.toLowerCase();
    const rows = document.querySelectorAll('#projectsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Dynamic Filter System
let activeFilters = {};
let filtersInitialized = false;

function initializeDynamicFilters() {
    // Only initialize once
    if (filtersInitialized) return;
    filtersInitialized = true;
    
    const addFilterBtn = document.getElementById('addFilterBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const closeDropdownBtn = document.getElementById('closeFilterDropdown');
    const filterOptions = document.querySelectorAll('.filter-option');
    
    // Show filter dropdown
    addFilterBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        filterDropdown.style.display = filterDropdown.style.display === 'none' ? 'block' : 'none';
    });
    
    // Close dropdown
    closeDropdownBtn.addEventListener('click', function() {
        filterDropdown.style.display = 'none';
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!filterDropdown.contains(e.target) && e.target !== addFilterBtn) {
            filterDropdown.style.display = 'none';
        }
    });
    
    // Add filter when option is clicked
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            const filterType = this.dataset.filter;
            addFilter(filterType);
            filterDropdown.style.display = 'none';
        });
    });
}

async function addFilter(filterType) {
    // Don't add if already exists
    if (activeFilters[filterType]) {
        return;
    }
    
    const container = document.getElementById('activeFilters');
    const chip = document.createElement('div');
    chip.className = 'filter-chip';
    chip.dataset.filterType = filterType;
    
    let filterLabel = '';
    let filterOptions = '';
    
    switch(filterType) {
        case 'year':
            filterLabel = 'Year:';
            filterOptions = await generateYearOptions();
            break;
        case 'status':
            filterLabel = 'Status:';
            filterOptions = `
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Deactive">Deactive</option>
                <option value="Temporary">Temporary</option>
            `;
            break;
        case 'manager':
            filterLabel = 'Manager:';
            filterOptions = await generateManagerOptions();
            break;
        case 'account':
            filterLabel = 'Account:';
            filterOptions = await generateAccountOptions();
            break;
    }
    
    chip.innerHTML = `
        <span class="filter-chip-label">${filterLabel}</span>
        <select class="filter-chip-value" data-filter="${filterType}">
            ${filterOptions}
        </select>
        <button class="filter-chip-remove" data-filter="${filterType}">×</button>
    `;
    
    container.appendChild(chip);
    activeFilters[filterType] = '';
    
    // Add event listeners
    const select = chip.querySelector('select');
    const removeBtn = chip.querySelector('.filter-chip-remove');
    
    select.addEventListener('change', function() {
        activeFilters[filterType] = this.value;
        applyProjectFilters();
    });
    
    removeBtn.addEventListener('click', function() {
        removeFilter(filterType);
    });
}

function removeFilter(filterType) {
    delete activeFilters[filterType];
    const chip = document.querySelector(`.filter-chip[data-filter-type="${filterType}"]`);
    if (chip) {
        chip.remove();
    }
    applyProjectFilters();
}

async function generateYearOptions() {
    const projects = await getProjects();
    if (!Array.isArray(projects)) {
        console.error('Projects is not an array:', projects);
        return '<option value="">All Years</option>';
    }
    const years = new Set();
    
    projects.forEach(project => {
        if (project.endDate) {
            const parts = project.endDate.split('-');
            if (parts.length === 3) {
                let year = parseInt(parts[2]);
                if (year < 100) year += 2000;
                years.add(year);
            }
        }
    });
    
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    let options = '<option value="">All Years</option>';
    sortedYears.forEach(year => {
        options += `<option value="${year}">${year}</option>`;
    });
    
    return options;
}

async function generateManagerOptions() {
    const projects = await getProjects();
    if (!Array.isArray(projects)) {
        console.error('Projects is not an array:', projects);
        return '<option value="">All Managers</option>';
    }
    const managers = new Set();
    
    projects.forEach(project => {
        if (project.manager) {
            managers.add(project.manager);
        }
    });
    
    const sortedManagers = Array.from(managers).sort();
    let options = '<option value="">All Managers</option>';
    sortedManagers.forEach(manager => {
        options += `<option value="${manager}">${manager}</option>`;
    });
    
    return options;
}

async function generateAccountOptions() {
    const projects = await getProjects();
    if (!Array.isArray(projects)) {
        console.error('Projects is not an array:', projects);
        return '<option value="">All Accounts</option>';
    }
    const accounts = new Set();
    
    projects.forEach(project => {
        if (project.account) {
            accounts.add(project.account);
        }
    });
    
    const sortedAccounts = Array.from(accounts).sort();
    let options = '<option value="">All Accounts</option>';
    sortedAccounts.forEach(account => {
        options += `<option value="${account}">${account}</option>`;
    });
    
    return options;
}

function applyProjectFilters() {
    const searchTerm = document.getElementById('searchProjects').value.toLowerCase();
    const timePeriod = document.getElementById('projectsTimePeriod').value;
    const rows = document.querySelectorAll('#projectsTableBody tr:not(.project-details)');
    
    rows.forEach(row => {
        let show = true;
        
        // Apply search filter
        if (searchTerm) {
            const text = row.textContent.toLowerCase();
            if (!text.includes(searchTerm)) {
                show = false;
            }
        }
        
        // Apply time period filter
        if (show && timePeriod !== 'all') {
            const cells = row.querySelectorAll('td');
            const projects = getProjects();
            const projectIndex = parseInt(cells[1]?.textContent.trim()) - 1;
            const project = projects[projectIndex];
            
            if (project && project.startDate) {
                if (!isDateInPeriod(project.startDate, timePeriod)) {
                    show = false;
                }
            }
        }
        
        // Apply dynamic filters
        if (show && Object.keys(activeFilters).length > 0) {
            const cells = row.querySelectorAll('td');
            
            // Get project data from row
            const account = cells[2]?.textContent.trim();
            const status = cells[4]?.textContent.trim();
            
            // Find project to get manager and year
            const projects = getProjects();
            const projectIndex = parseInt(cells[1]?.textContent.trim()) - 1;
            const project = projects[projectIndex];
            
            if (project) {
                // Year filter
                if (activeFilters.year && activeFilters.year !== '') {
                    if (project.endDate) {
                        const parts = project.endDate.split('-');
                        if (parts.length === 3) {
                            let year = parseInt(parts[2]);
                            if (year < 100) year += 2000;
                            if (year.toString() !== activeFilters.year) {
                                show = false;
                            }
                        }
                    } else {
                        show = false;
                    }
                }
                
                // Status filter
                if (activeFilters.status && activeFilters.status !== '') {
                    if (status !== activeFilters.status) {
                        show = false;
                    }
                }
                
                // Manager filter
                if (activeFilters.manager && activeFilters.manager !== '') {
                    if (project.manager !== activeFilters.manager) {
                        show = false;
                    }
                }
                
                // Account filter
                if (activeFilters.account && activeFilters.account !== '') {
                    if (account !== activeFilters.account) {
                        show = false;
                    }
                }
            }
        }
        
        row.style.display = show ? '' : 'none';
        
        // Also hide/show the details row if it exists
        const detailsRow = row.nextElementSibling;
        if (detailsRow && detailsRow.classList.contains('project-details')) {
            detailsRow.style.display = show ? '' : 'none';
        }
    });
}

// Export function
function exportData() {
    const entries = getWorkEntries();
    
    if (entries.length === 0) {
        showAlert('warning', 'No tasks to export');
        return;
    }
    
    // Create CSV
    const headers = ['Project', 'Code', 'Title', 'Description', 'Start Date', 'End Date', 'Hours', 'Status', 'Manager', 'Comments'];
    const rows = entries.map(e => {
        const allComments = e.commentsHistory ? e.commentsHistory.map(c => `[${formatDate(c.date)}] ${c.text}`).join(' | ') : '';
        return [
            e.project,
            e.code,
            e.title,
            e.description,
            e.startDate,
            e.endDate || '',
            e.hoursAdded,
            e.status,
            e.manager,
            allComments
        ];
    });
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `worklog-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showAlert('success', 'Data exported successfully!');
}

// Utility functions
function clearFormFields() {
    document.getElementById('code').value = '';
    document.getElementById('manager').value = '';
    document.getElementById('product').value = '';
    document.getElementById('projectStatus').value = '';
    document.getElementById('totalHoursField').value = '';
    document.getElementById('alreadyClaimed').value = '';
    document.getElementById('pendingHours').value = '';
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
}

function editEntry(id) {
    openModal(id);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit'
    });
}

function showAlert(type, message) {
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) existingAlert.remove();
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);
    
    setTimeout(() => alert.remove(), 5000);
}

// Make functions available globally
window.deleteEntry = deleteEntry;
window.editEntry = editEntry;

// Project Management Storage
const PROJECTS_STORAGE_KEY = 'workTrackerProjects';

function getProjectsData() {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (stored) {
        const projects = JSON.parse(stored);
        // Normalize status for all existing projects
        projects.forEach(project => {
            if (project.status) {
                project.status = normalizeStatus(project.status);
            }
        });
        return projects;
    }
    // Return empty array - projects should be imported from Monday.com
    return [];
}

function saveProjectsData(projects) {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

// Project Modal Functions
function openProjectModal(account = null) {
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const claimedHoursGroup = document.getElementById('claimedHoursGroup');
    
    if (account) {
        // Edit mode
        const projects = getProjectsData();
        const project = projects.find(p => p.account === account);
        if (project) {
            document.getElementById('projectModalTitle').textContent = 'Edit Project';
            document.getElementById('submitProjectBtn').textContent = 'Update Project';
            document.getElementById('editProjectAccount').value = account;
            
            document.getElementById('projectAccount').value = project.account;
            document.getElementById('projectCode').value = project.code;
            document.getElementById('projectProduct').value = project.product;
            document.getElementById('projectVersion').value = project.version || '';
            document.getElementById('projectManager').value = project.manager;
            document.getElementById('projectStartDate').value = formatDateForInput(project.startDate);
            document.getElementById('projectEndDate').value = project.endDate ? formatDateForInput(project.endDate) : '';
            document.getElementById('projectStatus').value = project.status;
            document.getElementById('projectTotalHours').value = project.totalHours;
            
            // Show claimed hours field in edit mode
            claimedHoursGroup.style.display = 'block';
            const currentClaimed = getClaimedHours(account);
            document.getElementById('projectClaimedHours').value = currentClaimed;
        }
    } else {
        // Add mode
        document.getElementById('projectModalTitle').textContent = 'Add Project';
        document.getElementById('submitProjectBtn').textContent = 'Add Project';
        document.getElementById('editProjectAccount').value = '';
        claimedHoursGroup.style.display = 'none';
        
        // Reset form first
        form.reset();
        
        // Then set default values AFTER reset
        document.getElementById('projectStatus').value = 'Active';
        document.getElementById('projectClaimedHours').value = 0;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
    document.getElementById('projectModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    document.getElementById('projectForm').reset();
}

function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    // Convert DD-MM-YY to YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        if (year.length === 2) {
            year = '20' + year;
        }
        return `${year}-${month}-${day}`;
    }
    return '';
}

function formatDateForDisplay(dateStr) {
    if (!dateStr) return '';
    // Convert YYYY-MM-DD to DD-MM-YY
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
}

function handleProjectFormSubmit(e) {
    e.preventDefault();
    
    const editAccount = document.getElementById('editProjectAccount').value;
    const isEdit = editAccount !== '';
    
    const projectData = {
        account: document.getElementById('projectAccount').value,
        code: document.getElementById('projectCode').value,
        product: document.getElementById('projectProduct').value,
        version: document.getElementById('projectVersion').value,
        manager: document.getElementById('projectManager').value,
        startDate: formatDateForDisplay(document.getElementById('projectStartDate').value),
        endDate: document.getElementById('projectEndDate').value ? formatDateForDisplay(document.getElementById('projectEndDate').value) : '',
        status: document.getElementById('projectStatus').value,
        totalHours: parseInt(document.getElementById('projectTotalHours').value)
    };
    
    let projects = getProjectsData();
    
    if (isEdit) {
        // Update existing project
        const index = projects.findIndex(p => p.account === editAccount);
        if (index !== -1) {
            projects[index] = projectData;
            
            // Update claimed hours if manually adjusted
            const manualClaimedHours = parseFloat(document.getElementById('projectClaimedHours').value);
            const currentClaimedHours = getClaimedHours(editAccount);
            
            if (manualClaimedHours !== currentClaimedHours) {
                // User manually adjusted claimed hours
                const claimedHours = localStorage.getItem(CLAIMED_HOURS_KEY);
                const hoursData = claimedHours ? JSON.parse(claimedHours) : {};
                hoursData[projectData.account] = manualClaimedHours;
                localStorage.setItem(CLAIMED_HOURS_KEY, JSON.stringify(hoursData));
                showAlert('success', 'Project and claimed hours updated successfully!');
            } else {
                showAlert('success', 'Project updated successfully!');
            }
        }
    } else {
        // Add new project
        projects.push(projectData);
        
        // Save manually entered claimed hours if provided
        const manualClaimedHours = parseFloat(document.getElementById('projectClaimedHours').value) || 0;
        if (manualClaimedHours > 0) {
            const claimedHours = localStorage.getItem(CLAIMED_HOURS_KEY);
            const hoursData = claimedHours ? JSON.parse(claimedHours) : {};
            hoursData[projectData.account] = manualClaimedHours;
            localStorage.setItem(CLAIMED_HOURS_KEY, JSON.stringify(hoursData));
            showAlert('success', 'Project added with manual claimed hours!');
        } else {
            showAlert('success', 'Project added successfully!');
        }
    }
    
    saveProjectsData(projects);
    closeProjectModal();
    
    // Refresh dropdowns and views
    refreshProjectDropdowns();
    updateAllViews();
}

function deleteProject(account) {
    if (!confirm(`Delete project "${account}"? This will also delete all associated work tasks.`)) {
        return;
    }
    
    let projects = getProjectsData();
    projects = projects.filter(p => p.account !== account);
    saveProjectsData(projects);
    
    // Delete associated entries
    let entries = getWorkEntries();
    entries = entries.filter(e => e.project !== account);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    
    // Update claimed hours
    const claimedHours = localStorage.getItem(CLAIMED_HOURS_KEY);
    const hoursData = claimedHours ? JSON.parse(claimedHours) : {};
    delete hoursData[account];
    localStorage.setItem(CLAIMED_HOURS_KEY, JSON.stringify(hoursData));
    
    showAlert('success', 'Project and associated tasks deleted!');
    refreshProjectDropdowns();
    updateAllViews();
}

function refreshProjectDropdowns() {
    const projects = getProjectsData();
    
    // Clear and repopulate all dropdowns
    const projectSelect = document.getElementById('projectSelect');
    const projectFilter = document.getElementById('projectFilter');
    const analyticsProjectFilter = document.getElementById('analyticsProjectFilter');
    
    projectSelect.innerHTML = '<option value="">-- Select Project --</option>';
    projectFilter.innerHTML = '<option value="">All projects</option>';
    analyticsProjectFilter.innerHTML = '<option value="">All Projects</option>';
    
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.account;
        option.textContent = `${project.account} - ${project.code}`;
        projectSelect.appendChild(option);
        
        projectFilter.appendChild(option.cloneNode(true));
        analyticsProjectFilter.appendChild(option.cloneNode(true));
    });
}

// Analytics View
function populateMonthPicker() {
    const entries = getWorkEntries();
    const monthPicker = document.getElementById('monthPicker');
    
    if (!monthPicker || entries.length === 0) return;
    
    // Get all unique year-month combinations from entries
    const monthsSet = new Set();
    entries.forEach(entry => {
        const date = new Date(entry.startDate);
        const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthsSet.add(yearMonth);
    });
    
    // Convert to array and sort (newest first)
    const months = Array.from(monthsSet).sort().reverse();
    
    // Populate dropdown
    monthPicker.innerHTML = months.map(yearMonth => {
        const [year, month] = yearMonth.split('-');
        const date = new Date(year, month - 1);
        const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        return `<option value="${yearMonth}">${monthName}</option>`;
    }).join('');
}

function updateAnalyticsView() {
    const entries = getWorkEntries();
    const timePeriod = document.getElementById('timePeriod').value;
    const projectFilter = document.getElementById('analyticsProjectFilter').value;
    
    // Get date range based on period
    const now = new Date();
    let startDate, endDate;
    
    switch(timePeriod) {
        case 'week':
            // Get start of current week (Sunday)
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay());
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'custom-month':
            const monthPicker = document.getElementById('monthPicker');
            if (monthPicker && monthPicker.value) {
                const [year, month] = monthPicker.value.split('-');
                startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
            } else {
                // Default to current month if no selection
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            }
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        case 'all':
        default:
            startDate = new Date(0);
            endDate = new Date();
            break;
    }
    
    // Filter entries by date range and project
    const filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.startDate);
        const inDateRange = entryDate >= startDate && entryDate <= endDate;
        const matchesProject = !projectFilter || entry.project === projectFilter;
        return inDateRange && matchesProject;
    });
    
    // Calculate stats
    const totalHours = filteredEntries.reduce((sum, e) => sum + e.hoursAdded, 0);
    const uniqueProjects = [...new Set(filteredEntries.map(e => e.project))];
    
    // Get total project count from all projects, not just those with entries
    const allProjects = getProjectsData();
    const totalProjectCount = allProjects.length;
    
    // Update period label
    const periodLabels = {
        'week': 'This Week',
        'month': 'This Month',
        'custom-month': 'Selected Month',
        'year': 'This Year',
        'all': 'All Time'
    };
    
    let periodLabel = periodLabels[timePeriod];
    if (timePeriod === 'custom-month') {
        const monthPicker = document.getElementById('monthPicker');
        if (monthPicker && monthPicker.value) {
            const [year, month] = monthPicker.value.split('-');
            const date = new Date(year, month - 1);
            periodLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        }
    }
    document.getElementById('periodLabel').textContent = periodLabel;
    document.getElementById('periodHours').textContent = totalHours.toFixed(1);
    document.getElementById('periodEntries').textContent = filteredEntries.length;
    document.getElementById('periodProjects').textContent = totalProjectCount;
    
    // Group by project
    const projectStats = {};
    filteredEntries.forEach(entry => {
        if (!projectStats[entry.project]) {
            projectStats[entry.project] = {
                entries: 0,
                hours: 0
            };
        }
        projectStats[entry.project].entries++;
        projectStats[entry.project].hours += entry.hoursAdded;
    });
    
    // Update table
    const tbody = document.getElementById('analyticsTableBody');
    
    if (Object.keys(projectStats).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state"><h3>No data for this period</h3><p>Try selecting a different time period or project</p></td></tr>';
        return;
    }
    
    tbody.innerHTML = Object.entries(projectStats)
        .sort((a, b) => b[1].hours - a[1].hours)
        .map(([project, stats]) => {
            const avgPerEntry = stats.hours / stats.entries;
            const percentage = totalHours > 0 ? (stats.hours / totalHours * 100) : 0;
            
            return `
                <tr>
                    <td>${project}</td>
                    <td>${stats.entries}</td>
                    <td>${stats.hours.toFixed(1)}</td>
                    <td>${avgPerEntry.toFixed(1)}</td>
                    <td>${percentage.toFixed(0)}%</td>
                </tr>
            `;
        }).join('');
    
    // Generate analytics visualizations
    generateAnalyticsVisualizations();
}

// Generate Analytics Visualizations
function generateAnalyticsVisualizations() {
    // Always get fresh data from storage
    const projects = getProjectsData();
    const entries = getWorkEntries();
    const timePeriod = document.getElementById('timePeriod')?.value || 'week';
    
    console.log('Generating analytics visualizations with', projects.length, 'projects');
    
    // 1. Trend Chart based on time period
    const trendChartSection = document.getElementById('trendChartSection');
    if (trendChartSection) {
        trendChartSection.style.display = 'block';
        generateTrendChart(entries, timePeriod);
    }
    
    // 2. Status Pie Chart - always regenerate with fresh data
    generateStatusPieChart(projects);
    
    // 3. Project Hours Distribution Chart - always regenerate with fresh data
    generateHoursDistributionChart(projects);
}

// Generate trend chart - ALWAYS show weekly data
function generateTrendChart(entries, timePeriod) {
    const container = document.getElementById('analyticsTrendChart');
    const titleElement = document.getElementById('trendChartTitle');
    
    if (!container) return;
    
    console.log('generateTrendChart called with', entries.length, 'entries and period:', timePeriod);
    
    // Filter entries by time period
    const filteredEntries = entries.filter(entry => isDateInPeriod(entry.startDate, timePeriod));
    
    console.log('Filtered to', filteredEntries.length, 'entries for period:', timePeriod);
    
    if (filteredEntries.length === 0) {
        const periodNames = {
            'week': 'this week',
            'month': 'this month',
            'quarter': 'this quarter',
            'year': 'this year',
            'all': 'all time'
        };
        container.innerHTML = `<p style="text-align: center; color: #999; padding: 40px 0;">No work entries found for ${periodNames[timePeriod] || 'this period'}.<br><small>Try selecting a different time period or add work entries.</small></p>`;
        return;
    }
    
    // ALWAYS show weekly breakdown regardless of time period
    const chartTitle = 'Weekly Hours Claimed';
    const chartData = generateWeeklyDataForPeriod(filteredEntries, timePeriod);
    
    console.log('Chart data generated:', chartData);
    
    if (chartData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px 0;">No weekly data available for this period</p>';
        return;
    }
    
    titleElement.textContent = chartTitle;
    renderTrendChart(container, chartData);
}

// Generate weekly data for any time period
function generateWeeklyDataForPeriod(entries, timePeriod) {
    const weeklyHours = {};
    
    // Get the date range for the selected period
    const now = new Date();
    let periodStart, periodEnd;
    
    switch(timePeriod) {
        case 'week':
            periodStart = new Date(now);
            periodStart.setDate(now.getDate() - now.getDay());
            periodStart.setHours(0, 0, 0, 0);
            periodEnd = new Date(now);
            periodEnd.setHours(23, 59, 59, 999);
            break;
        case 'month':
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'custom-month':
            const monthPicker = document.getElementById('monthPicker');
            if (monthPicker && monthPicker.value) {
                const [year, month] = monthPicker.value.split('-');
                periodStart = new Date(parseInt(year), parseInt(month) - 1, 1);
                periodEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
            } else {
                periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
                periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            }
            break;
        case 'year':
            periodStart = new Date(now.getFullYear(), 0, 1);
            periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        case 'all':
        default:
            periodStart = new Date(0);
            periodEnd = new Date();
            break;
    }
    
    // IMPORTANT: entries are already filtered by the calling function
    // We just need to group them by week
    entries.forEach(entry => {
        const entryDate = new Date(entry.startDate);
        // Get the start of the week (Sunday)
        const weekStart = new Date(entryDate);
        weekStart.setDate(entryDate.getDate() - entryDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString().split('T')[0];
        
        weeklyHours[weekKey] = (weeklyHours[weekKey] || 0) + entry.hoursAdded;
    });
    
    // Sort by week and create data points
    const sortedWeeks = Object.keys(weeklyHours).sort();
    
    return sortedWeeks.map(week => {
        const weekDate = new Date(week);
        const weekNum = getWeekNumber(weekDate);
        return {
            label: `Week ${weekNum}`,
            value: weeklyHours[week]
        };
    });
}

// Get week number of the year
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// Generate daily data for week view
function generateDailyData(entries) {
    const dailyHours = {};
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    
    // Initialize all days of the week
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyHours[dateStr] = 0;
    }
    
    // Sum hours by day
    entries.forEach(entry => {
        const dateStr = entry.startDate;
        if (dailyHours.hasOwnProperty(dateStr)) {
            dailyHours[dateStr] += parseFloat(entry.hours) || 0;
        }
    });
    
    return Object.entries(dailyHours).map(([date, hours]) => ({
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        value: hours
    }));
}

// Generate weekly data for month view
function generateWeeklyData(entries) {
    const weeklyHours = {};
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Initialize weeks of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 7)) {
        const weekNum = getWeekNumber(d);
        const weekKey = `Week ${weekNum}`;
        weeklyHours[weekKey] = 0;
    }
    
    entries.forEach(entry => {
        const date = new Date(entry.startDate);
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
            const weekNum = getWeekNumber(date);
            const weekKey = `Week ${weekNum}`;
            
            if (!weeklyHours[weekKey]) {
                weeklyHours[weekKey] = 0;
            }
            weeklyHours[weekKey] += parseFloat(entry.hours) || 0;
        }
    });
    
    return Object.entries(weeklyHours)
        .sort((a, b) => parseInt(a[0].split(' ')[1]) - parseInt(b[0].split(' ')[1]))
        .map(([week, hours]) => ({
            label: week,
            value: hours
        }));
}

// Generate monthly data for quarter/year view
function generateMonthlyData(entries, timePeriod) {
    const monthlyHours = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    entries.forEach(entry => {
        const date = new Date(entry.startDate);
        const monthKey = monthNames[date.getMonth()];
        
        if (!monthlyHours[monthKey]) {
            monthlyHours[monthKey] = 0;
        }
        monthlyHours[monthKey] += parseFloat(entry.hours) || 0;
    });
    
    return Object.entries(monthlyHours).map(([month, hours]) => ({
        label: month,
        value: hours
    }));
}

// Get week number of the year
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Render trend chart
function renderTrendChart(container, data) {
    if (data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No data available</p>';
        return;
    }
    
    console.log('Rendering trend chart with data:', data);
    
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const width = 800;
    const height = 250;
    const padding = { top: 30, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Gradient definition first
    let svg = `<defs>
        <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#667EEA;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764BA2;stop-opacity:1" />
        </linearGradient>
    </defs>`;
    
    // Draw Y-axis line
    svg += `<line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${padding.top + chartHeight}"
            stroke="#e0e0e0" stroke-width="1"/>`;
    
    // Draw X-axis line
    svg += `<line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${padding.left + chartWidth}" y2="${padding.top + chartHeight}"
            stroke="#e0e0e0" stroke-width="1"/>`;
    
    // Draw bars
    const barWidth = chartWidth / data.length;
    const barSpacing = Math.max(barWidth * 0.7, 30); // Minimum 30px bar width
    const barGap = (barWidth - barSpacing) / 2;
    
    data.forEach((d, i) => {
        const barHeight = Math.max((d.value / maxValue) * chartHeight, 2); // Minimum 2px height
        const x = padding.left + i * barWidth + barGap;
        const y = padding.top + chartHeight - barHeight;
        
        svg += `<rect x="${x}" y="${y}" width="${barSpacing}" height="${barHeight}"
                fill="url(#barGradient)" rx="4" class="trend-bar" opacity="0.9">
                <title>${d.label}: ${d.value.toFixed(1)} hours</title>
                </rect>`;
        
        // Value label on top of bar
        if (d.value > 0) {
            svg += `<text x="${x + barSpacing / 2}" y="${y - 8}" text-anchor="middle"
                    style="font-size: 12px; font-weight: 700; fill: #667EEA;">${d.value.toFixed(1)}</text>`;
        }
        
        // X-axis label
        svg += `<text x="${x + barSpacing / 2}" y="${padding.top + chartHeight + 25}" text-anchor="middle"
                style="font-size: 12px; fill: #666; font-weight: 500;">${d.label}</text>`;
    });
    
    const fullSvg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="max-width: 100%; background: white; border-radius: 8px;">${svg}</svg>`;
    container.innerHTML = fullSvg;
    
    console.log('Chart rendered successfully');
}

function generateHoursTrendChart(entries) {
    const container = document.getElementById('analyticsHoursTrendChart');
    if (!container) return;
    
    if (entries.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No task data available</p>';
        return;
    }
    
    // Group entries by date and sum hours
    const dateHours = {};
    entries.forEach(entry => {
        const date = entry.startDate;
        dateHours[date] = (dateHours[date] || 0) + entry.hoursAdded;
    });
    
    // Sort by date and get last 7 data points
    const sortedDates = Object.keys(dateHours).sort();
    const recentDates = sortedDates.slice(-7);
    
    if (recentDates.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Not enough data for trend</p>';
        return;
    }
    
    const dataPoints = recentDates.map(date => ({
        date,
        hours: dateHours[date]
    }));
    
    // SVG dimensions
    const width = 400;
    const height = 220;
    const padding = {top: 20, right: 20, bottom: 40, left: 50};
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxHours = Math.max(...dataPoints.map(d => d.hours));
    const minHours = 0;
    
    // Create SVG
    let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="trend-chart">`;
    
    // Grid lines
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        const value = maxHours - (maxHours / 4) * i;
        svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="trend-grid-line"/>`;
        svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" class="trend-label">${value.toFixed(0)}h</text>`;
    }
    
    // Create path for line
    const points = dataPoints.map((d, i) => {
        const x = padding.left + (chartWidth / (dataPoints.length - 1)) * i;
        const y = padding.top + chartHeight - ((d.hours - minHours) / (maxHours - minHours)) * chartHeight;
        return {x, y, ...d};
    });
    
    // Area under line
    const areaPath = `M ${points[0].x},${height - padding.bottom} ` +
        points.map(p => `L ${p.x},${p.y}`).join(' ') +
        ` L ${points[points.length - 1].x},${height - padding.bottom} Z`;
    svg += `<path d="${areaPath}" class="trend-area"/>`;
    
    // Line
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    svg += `<path d="${linePath}" class="trend-line"/>`;
    
    // Points
    points.forEach(p => {
        svg += `<circle cx="${p.x}" cy="${p.y}" r="4" class="trend-point">
            <title>${p.date}: ${p.hours}h</title>
        </circle>`;
    });
    
    // X-axis labels
    points.forEach((p, i) => {
        const dateObj = new Date(p.date);
        const label = dateObj.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
        svg += `<text x="${p.x}" y="${height - padding.bottom + 20}" text-anchor="middle" class="trend-label">${label}</text>`;
    });
    
    svg += '</svg>';
    container.innerHTML = svg;
}

function generateWeeklyHoursChart(entries, timePeriod) {
    const container = document.getElementById('analyticsWeeklyHoursChart');
    if (!container) return;
    
    if (entries.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No task data available</p>';
        return;
    }
    
    // Get date range based on period
    const now = new Date();
    let startDate, endDate;
    
    switch(timePeriod) {
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            break;
        case 'quarter':
            const currentQuarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
            endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            break;
        default:
            startDate = new Date(0);
            endDate = new Date();
    }
    
    // Filter entries by date range
    const filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.startDate);
        return entryDate >= startDate && entryDate <= endDate;
    });
    
    if (filteredEntries.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No data for this period</p>';
        return;
    }
    
    // Group entries by week
    const weeklyHours = {};
    filteredEntries.forEach(entry => {
        const entryDate = new Date(entry.startDate);
        // Get the start of the week (Sunday)
        const weekStart = new Date(entryDate);
        weekStart.setDate(entryDate.getDate() - entryDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekKey = weekStart.toISOString().split('T')[0];
        
        weeklyHours[weekKey] = (weeklyHours[weekKey] || 0) + entry.hoursAdded;
    });
    
    // Sort by week and create data points
    const sortedWeeks = Object.keys(weeklyHours).sort();
    
    if (sortedWeeks.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Not enough data for weekly breakdown</p>';
        return;
    }
    
    const dataPoints = sortedWeeks.map(week => ({
        week,
        hours: weeklyHours[week]
    }));
    
    // SVG dimensions
    const width = 400;
    const height = 220;
    const padding = {top: 20, right: 20, bottom: 40, left: 50};
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const maxHours = Math.max(...dataPoints.map(d => d.hours));
    const minHours = 0;
    
    // Create SVG
    let svg = `<svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" class="trend-chart">`;
    
    // Grid lines
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        const value = maxHours - (maxHours / 4) * i;
        svg += `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" class="trend-grid-line"/>`;
        svg += `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" class="trend-label">${value.toFixed(0)}h</text>`;
    }
    
    // Create bars
    const barWidth = chartWidth / dataPoints.length * 0.7;
    const barSpacing = chartWidth / dataPoints.length;
    
    dataPoints.forEach((d, i) => {
        const x = padding.left + barSpacing * i + (barSpacing - barWidth) / 2;
        const barHeight = ((d.hours - minHours) / (maxHours - minHours)) * chartHeight;
        const y = padding.top + chartHeight - barHeight;
        
        svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" class="trend-bar" rx="3">
            <title>Week of ${new Date(d.week).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}: ${d.hours.toFixed(1)}h</title>
        </rect>`;
        
        // Add value label on top of bar
        svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" class="trend-label" style="font-size: 11px; font-weight: bold;">${d.hours.toFixed(0)}h</text>`;
    });
    
    // X-axis labels
    dataPoints.forEach((d, i) => {
        const x = padding.left + barSpacing * i + barSpacing / 2;
        const dateObj = new Date(d.week);
        const label = dateObj.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
        svg += `<text x="${x}" y="${height - padding.bottom + 20}" text-anchor="middle" class="trend-label" style="font-size: 10px;">${label}</text>`;
    });
    
    svg += '</svg>';
    container.innerHTML = svg;
}

function generateStatusPieChart(projects) {
    const container = document.getElementById('analyticsStatusPieChart');
    if (!container) return;
    
    // Always get fresh data from storage to ensure we have the latest
    const freshProjects = getProjectsData();
    
    console.log('Generating pie chart with', freshProjects.length, 'projects:', freshProjects);
    
    if (freshProjects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No project data available</p>';
        return;
    }
    
    // Count projects by status - count ALL projects, defaulting to 'Active' if no status
    const statusCounts = {};
    freshProjects.forEach(project => {
        // Normalize status or default to Active
        const status = project.status ? normalizeStatus(project.status) : 'Active';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('Status counts:', statusCounts);
    
    // If no projects have status, show a message
    if (Object.keys(statusCounts).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No status data available</p>';
        return;
    }
    
    const statusColors = {
        'Active': '#4caf50',
        'Deactive': '#9e9e9e',
        'Temporary': '#2196f3'
    };
    
    const statusIcons = {
        'Active': '📊',
        'Deactive': '⏸️',
        'Temporary': '⏱️'
    };
    
    // Calculate percentages and create slices
    const total = freshProjects.length;
    const slices = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
        percentage: (count / total) * 100,
        color: statusColors[status] || '#757575',
        icon: statusIcons[status] || '📊'
    })).sort((a, b) => b.count - a.count);
    
    // SVG pie chart
    const size = 180;
    const center = size / 2;
    const radius = size / 2 - 10;
    
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="pie-chart-svg">`;
    
    // Special case: if only one slice (100%), draw a full circle
    if (slices.length === 1 && slices[0].percentage === 100) {
        svg += `<circle cx="${center}" cy="${center}" r="${radius}" fill="${slices[0].color}" class="pie-slice">
            <title>${slices[0].status}: ${slices[0].count} (100%)</title>
        </circle>`;
    } else {
        let currentAngle = -90; // Start from top
        
        slices.forEach(slice => {
            const angle = (slice.percentage / 100) * 360;
            const endAngle = currentAngle + angle;
            
            const startRad = (currentAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            
            const x1 = center + radius * Math.cos(startRad);
            const y1 = center + radius * Math.sin(startRad);
            const x2 = center + radius * Math.cos(endRad);
            const y2 = center + radius * Math.sin(endRad);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            const pathData = [
                `M ${center} ${center}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                'Z'
            ].join(' ');
            
            svg += `<path d="${pathData}" fill="${slice.color}" class="pie-slice">
                <title>${slice.status}: ${slice.count} (${slice.percentage.toFixed(1)}%)</title>
            </path>`;
            
            currentAngle = endAngle;
        });
    }
    
    svg += '</svg>';
    
    // Legend
    const legend = `
        <div class="pie-legend">
            ${slices.map(slice => `
                <div class="pie-legend-item">
                    <div class="pie-legend-color" style="background: ${slice.color}"></div>
                    <span class="pie-legend-label">${slice.icon} ${slice.status}</span>
                    <span class="pie-legend-value">${slice.count}</span>
                    <span class="pie-legend-percent">(${slice.percentage.toFixed(0)}%)</span>
                </div>
            `).join('')}
        </div>
    `;
    
    container.innerHTML = svg + legend;
}
function generateHoursDistributionChart(projects) {
    const container = document.getElementById('analyticsHoursDistributionChart');
    if (!container) return;
    
    // Always get fresh data from storage to ensure we have the latest
    const freshProjects = getProjectsData();
    
    if (freshProjects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No project data available</p>';
        return;
    }
    
    // Use fresh projects for the rest of the function
    projects = freshProjects;
    
    
    if (projects.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No project data available</p>';
        return;
    }
    
    // Calculate totals
    let totalHours = 0;
    let totalClaimed = 0;
    let totalPending = 0;
    
    projects.forEach(project => {
        const claimed = getClaimedHours(project.account);
        const pending = project.totalHours - claimed;
        
        totalHours += project.totalHours;
        totalClaimed += claimed;
        totalPending += pending;
    });
    
    // Calculate percentages for visual representation
    const claimedPercent = totalHours > 0 ? (totalClaimed / totalHours * 100) : 0;
    const pendingPercent = totalHours > 0 ? (totalPending / totalHours * 100) : 0;
    
    container.innerHTML = `
        <div style="padding: 10px;">
            <!-- Summary Stats -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
                <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">
                    <div style="font-size: 0.75em; letter-spacing: 1px; margin-bottom: 5px; opacity: 0.9;">TOTAL HOURS</div>
                    <div style="font-size: 1.8em; font-weight: 700;">${totalHours.toFixed(1)}</div>
                </div>
                <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; color: white;">
                    <div style="font-size: 0.75em; letter-spacing: 1px; margin-bottom: 5px; opacity: 0.9;">CLAIMED</div>
                    <div style="font-size: 1.8em; font-weight: 700;">${totalClaimed.toFixed(1)}</div>
                    <div style="font-size: 0.85em; opacity: 0.9;">${claimedPercent.toFixed(1)}%</div>
                </div>
                <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border-radius: 8px; color: white;">
                    <div style="font-size: 0.75em; letter-spacing: 1px; margin-bottom: 5px; opacity: 0.9;">PENDING</div>
                    <div style="font-size: 1.8em; font-weight: 700;">${totalPending.toFixed(1)}</div>
                    <div style="font-size: 0.85em; opacity: 0.9;">${pendingPercent.toFixed(1)}%</div>
                </div>
            </div>
            
            <!-- Visual Bar -->
            <div style="margin-bottom: 20px;">
                <div style="display: flex; height: 40px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); width: ${claimedPercent}%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.9em;">
                        ${claimedPercent > 10 ? 'Claimed' : ''}
                    </div>
                    <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); width: ${pendingPercent}%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 0.9em;">
                        ${pendingPercent > 10 ? 'Pending' : ''}
                    </div>
                </div>
            </div>
            
            <!-- Top Projects by Hours -->
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                <h4 style="font-size: 0.9em; color: var(--text-secondary); margin-bottom: 15px; letter-spacing: 1px;">TOP PROJECTS BY TOTAL HOURS</h4>
                ${projects
                    .sort((a, b) => b.totalHours - a.totalHours)
                    .slice(0, 5)
                    .map(project => {
                        const claimed = getClaimedHours(project.account);
                        const pending = project.totalHours - claimed;
                        const claimedPct = project.totalHours > 0 ? (claimed / project.totalHours * 100) : 0;
                        
                        return `
                            <div style="margin-bottom: 15px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                    <span style="font-weight: 600; font-size: 0.9em;">${project.account}</span>
                                    <span style="font-size: 0.85em; color: var(--text-secondary);">${project.totalHours}h total</span>
                                </div>
                                <div style="display: flex; gap: 5px; height: 8px; border-radius: 4px; overflow: hidden; background: #f0f0f0;">
                                    <div style="background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%); width: ${claimedPct}%;" title="Claimed: ${claimed.toFixed(1)}h"></div>
                                    <div style="background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%); width: ${100 - claimedPct}%;" title="Pending: ${pending.toFixed(1)}h"></div>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-top: 3px; font-size: 0.75em; color: var(--text-secondary);">
                                    <span>Claimed: ${claimed.toFixed(1)}h</span>
                                    <span>Pending: ${pending.toFixed(1)}h</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
            </div>
        </div>
    `;
}


function editProject(account) {
    openProjectModal(account);
}

// Make project functions globally available
window.editProject = editProject;
window.deleteProject = deleteProject;

// Made with Bob

// Monday.com Integration
const MONDAY_CONFIG_KEY = 'mondayConfig';

// Load Monday.com configuration
function loadMondayConfig() {
    const config = localStorage.getItem(MONDAY_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
}

// Save Monday.com configuration
function saveMondayConfig(configOrApiKey, boardId) {
    let config;
    
    // Support both old signature (apiKey, boardId) and new signature (config object)
    if (typeof configOrApiKey === 'object') {
        config = {
            ...loadMondayConfig(),
            ...configOrApiKey,
            connectedAt: configOrApiKey.connectedAt || new Date().toISOString()
        };
    } else {
        // Legacy support: saveMondayConfig(apiKey, boardId)
        config = {
            apiKey: configOrApiKey,
            boardId: boardId,
            connectedAt: new Date().toISOString()
        };
    }
    
    localStorage.setItem(MONDAY_CONFIG_KEY, JSON.stringify(config));
    return config;
}

// Test Monday.com connection
async function testMondayConnection() {
    const apiKey = document.getElementById('mondayApiKey').value.trim();
    
    if (!apiKey) {
        alert('Please enter your Monday.com API token');
        return;
    }
    
    const statusIndicator = document.getElementById('mondayIndicator');
    const statusText = document.getElementById('mondayStatusText');
    
    statusIndicator.textContent = '🔄';
    statusText.textContent = 'Testing connection...';
    
    try {
        const response = await fetch('https://api.monday.com/v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey
            },
            body: JSON.stringify({
                query: 'query { me { name email } }'
            }),
            signal: AbortSignal.timeout(60000) // 60 second timeout
        });
        
        const data = await response.json();
        
        if (data.errors) {
            throw new Error(data.errors[0].message);
        }
        
        if (data.data && data.data.me) {
            statusIndicator.textContent = '🟢';
            statusText.textContent = `Connected as ${data.data.me.name}`;
            
            // Save API key
            const config = loadMondayConfig() || {};
            config.apiKey = apiKey;
            saveMondayConfig(config);
            
            // Update user info display immediately
            const userName = data.data.me.name || 'User';
            const userEmail = data.data.me.email || 'Not available';
            
            updateUserInfoDisplay(userName, userEmail);
            
            // Store for later use
            localStorage.setItem('mondayUserInfo', JSON.stringify({
                name: userName,
                email: userEmail
            }));
            
            // Fetch boards
            console.log('Fetching boards...');
            try {
                await fetchMondayBoards(apiKey);
                console.log('Boards fetched successfully');
            } catch (boardError) {
                console.error('Error fetching boards:', boardError);
                alert('Connected successfully, but failed to fetch boards. Please check console for details.');
            }
        } else {
            throw new Error('Invalid response from Monday.com');
        }
    } catch (error) {
        console.error('Monday.com connection error:', error);
        statusIndicator.textContent = '🔴';
        statusText.textContent = `Connection failed: ${error.message}`;
    }
}

// Data Management Functions
function exportAllData() {
    const data = {
        projects: getProjectsData(),
        entries: getWorkEntries(),
        claimedHours: JSON.parse(localStorage.getItem(CLAIMED_HOURS_KEY) || '{}'),
        mondayConfig: loadMondayConfig(),
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `worklog-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('success', 'Data exported successfully!');
}

function importData() {
    const fileInput = document.getElementById('importDataFile');
    fileInput.click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.projects || !data.entries) {
                showAlert('error', 'Invalid data file format');
                return;
            }
            
            // Confirm import
            if (!confirm('This will replace all current data. Are you sure you want to continue?')) {
                return;
            }
            
            // Import data
            if (data.projects) {
                localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(data.projects));
            }
            if (data.entries) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data.entries));
            }
            if (data.claimedHours) {
                localStorage.setItem(CLAIMED_HOURS_KEY, JSON.stringify(data.claimedHours));
            }
            if (data.mondayConfig) {
                localStorage.setItem(MONDAY_CONFIG_KEY, JSON.stringify(data.mondayConfig));
            }
            
            showAlert('success', 'Data imported successfully! Refreshing page...');
            setTimeout(() => location.reload(), 1500);
        } catch (error) {
            console.error('Import error:', error);
            showAlert('error', 'Failed to import data. Please check the file format.');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
}

function clearAllData() {
    if (!confirm('⚠️ WARNING: This will permanently delete ALL your projects, tasks, and settings. This action cannot be undone!\n\nAre you absolutely sure?')) {
        return;
    }
    
    if (!confirm('Last chance! Click OK to permanently delete everything.')) {
        return;
    }
    
    // Clear all localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROJECTS_STORAGE_KEY);
    localStorage.removeItem(CLAIMED_HOURS_KEY);
    localStorage.removeItem(MONDAY_CONFIG_KEY);
    
    showAlert('success', 'All data cleared successfully! Refreshing page...');
    setTimeout(() => location.reload(), 1500);
}

// Setup data management event listeners
function setupDataManagement() {
    const exportBtn = document.getElementById('exportDataBtn');
    const importBtn = document.getElementById('importDataBtn');
    const importFile = document.getElementById('importDataFile');
    const clearBtn = document.getElementById('clearDataBtn');
    const clearMondayBtn = document.getElementById('clearMondayDataBtn');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportAllData);
    }
    
    if (importBtn) {
        importBtn.addEventListener('click', importData);
    }
    
    if (importFile) {
        importFile.addEventListener('change', handleImportFile);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllData);
    }
    
    if (clearMondayBtn) {
        clearMondayBtn.addEventListener('click', clearMondayItems);
    }
}

// Fetch Monday.com boards
async function fetchMondayBoards(apiKey) {
    console.log('fetchMondayBoards called with apiKey:', apiKey ? 'present' : 'missing');
    try {
        console.log('Making API request to Monday.com...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout
        
        const response = await fetch('https://api.monday.com/v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': apiKey,
                'API-Version': '2024-01'
            },
            body: JSON.stringify({
                query: 'query { boards (limit: 50) { id name } }'
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('Response received, status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.errors) {
            console.error('Monday.com API errors:', data.errors);
            alert('Error fetching boards: ' + data.errors[0].message);
            return;
        }
        
        if (data.data && data.data.boards) {
            console.log('Found', data.data.boards.length, 'boards');
            displayMondayBoards(data.data.boards);
        } else {
            console.warn('No boards found in response');
            alert('No boards found in your Monday.com account');
        }
    } catch (error) {
        console.error('Error fetching boards:', error);
        
        let errorMessage = 'Failed to fetch boards: ';
        if (error.name === 'AbortError') {
            errorMessage += 'Request timed out. Please check your internet connection and try again.';
        } else if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Network error. This might be due to CORS restrictions or connectivity issues.';
        } else {
            errorMessage += error.message;
        }
        
        errorMessage += '\n\n✅ You can manually enter the Board ID instead.\n\nTo find your Board ID:\n1. Go to Monday.com\n2. Open your board\n3. Copy the number from the URL';
        
        alert(errorMessage);
    }
}

// Display Monday.com boards
function displayMondayBoards(boards) {
    console.log('displayMondayBoards called with', boards.length, 'boards');
    
    const boardsList = document.getElementById('boardsList');
    const boardsContainer = document.getElementById('mondayBoards');
    const boardDropdown = document.getElementById('boardDropdown');
    const boardSelector = document.getElementById('boardSelector');
    
    console.log('Elements found:', {
        boardsList: !!boardsList,
        boardsContainer: !!boardsContainer,
        boardDropdown: !!boardDropdown,
        boardSelector: !!boardSelector
    });
    
    if (boards.length === 0) {
        boardsList.innerHTML = '<p>No boards found</p>';
        return;
    }
    
    // Populate the old boards list (keep for backward compatibility)
    boardsList.innerHTML = boards.map(board => `
        <div class="board-item" onclick="selectMondayBoard('${board.id}', '${board.name}')">
            <span class="board-icon">📋</span>
            <span class="board-name">${board.name}</span>
            <span class="board-id">(ID: ${board.id})</span>
        </div>
    `).join('');
    
    // Populate the dropdown
    boardDropdown.innerHTML = '<option value="">-- Select a Board --</option>' +
        boards.map(board => `
            <option value="${board.id}" data-name="${board.name}">${board.name} (ID: ${board.id})</option>
        `).join('');
    
    boardsContainer.style.display = 'block';
    boardSelector.style.display = 'block';
    
    // Add change event listener to dropdown
    boardDropdown.addEventListener('change', handleBoardSelection);
}

// Handle board selection from dropdown
function handleBoardSelection(event) {
    const dropdown = event.target;
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const boardId = selectedOption.value;
    const boardName = selectedOption.getAttribute('data-name');
    
    if (boardId) {
        // Update the board ID field
        document.getElementById('mondayBoardId').value = boardId;
        
        // Show selected board info
        const selectedBoardInfo = document.getElementById('selectedBoardInfo');
        const selectedBoardName = document.getElementById('selectedBoardName');
        const selectedBoardId = document.getElementById('selectedBoardId');
        
        selectedBoardName.textContent = boardName;
        selectedBoardId.textContent = `(ID: ${boardId})`;
        selectedBoardInfo.style.display = 'flex';
        
        // Save to config
        const config = loadMondayConfig();
        config.boardId = boardId;
        config.boardName = boardName;
        saveMondayConfig(config);
        
        // Enable sync buttons
        document.getElementById('mondaySyncActions').style.display = 'flex';
    } else {
        // Hide selected board info if no board selected
        document.getElementById('selectedBoardInfo').style.display = 'none';
        document.getElementById('mondaySyncActions').style.display = 'none';
    }
}

// Select Monday.com board (legacy function for board list items)
function selectMondayBoard(boardId, boardName) {
    document.getElementById('mondayBoardId').value = boardId;
    
    // Update dropdown to match
    const dropdown = document.getElementById('boardDropdown');
    dropdown.value = boardId;
    
    // Trigger the change event to update UI
    const event = new Event('change');
    dropdown.dispatchEvent(event);
}

// Handle Monday.com configuration form submit
function handleMondayConfigSubmit(event) {
    event.preventDefault();
    
    const apiKey = document.getElementById('mondayApiKey').value.trim();
    const boardId = document.getElementById('mondayBoardId').value.trim();
    
    if (!apiKey) {
        alert('Please enter your Monday.com API token');
        return;
    }
    
    saveMondayConfig(apiKey, boardId);
    
    const statusIndicator = document.getElementById('mondayIndicator');
    const statusText = document.getElementById('mondayStatusText');
    const syncActions = document.getElementById('mondaySyncActions');
    
    statusIndicator.textContent = '🟢';
    statusText.textContent = 'Connected';
    syncActions.style.display = 'flex';
    
    alert('✅ Configuration saved successfully!\n\nYou can now sync your work tasks to Monday.com.');
}

// Show Monday.com progress bar
function showMondayProgress(message, percent) {
    const messageBox = document.getElementById('mondayMessageBox');
    const messageText = document.getElementById('mondayMessageText');
    
    if (messageBox && messageText) {
        messageBox.style.display = 'block';
        messageBox.className = 'monday-message-box progress';
        
        messageText.innerHTML = `
            <div class="progress-message">${message}</div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${percent}%"></div>
            </div>
            <div class="progress-percent">${percent}%</div>
        `;
    }
}

// Hide Monday.com progress bar
function hideMondayProgress() {
    const messageBox = document.getElementById('mondayMessageBox');
    if (messageBox) {
        messageBox.style.display = 'none';
    }
}

// Show Analytics progress message
function showAnalyticsMessage(message, type = 'info') {
    const messageBox = document.getElementById('analyticsMessageBox');
    const messageText = document.getElementById('analyticsMessageText');
    
    if (messageBox && messageText) {
        messageBox.style.display = 'block';
        messageBox.className = `monday-message-box ${type}`;
        messageText.textContent = message;
    }
}

// Hide Analytics message
function hideAnalyticsMessage() {
    const messageBox = document.getElementById('analyticsMessageBox');
    if (messageBox) {
        messageBox.style.display = 'none';
    }
}

// Import entries from Monday.com
async function importFromMonday() {
    const config = loadMondayConfig();
    
    if (!config || !config.apiKey) {
        showAlert('error', 'Please configure Monday.com integration first');
        return;
    }
    
    if (!config.boardId) {
        showAlert('error', 'Please select a board first');
        return;
    }
    
    try {
        // Disable buttons during import
        const importBtn = document.getElementById('importMondayItems');
        if (importBtn) {
            importBtn.disabled = true;
            importBtn.style.opacity = '0.5';
            importBtn.style.cursor = 'not-allowed';
        }
        
        // First, get the current user's information
        showMondayProgress('Fetching your user information...', 0);
        let currentUserEmail = '';
        let currentUserName = '';
        
        try {
            const userQuery = `query { me { id name email } }`;
            const userResponse = await fetch('https://api.monday.com/v2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': config.apiKey
                },
                body: JSON.stringify({ query: userQuery })
            });
            
            const userData = await userResponse.json();
            if (userData.data && userData.data.me) {
                currentUserEmail = userData.data.me.email || '';
                currentUserName = userData.data.me.name || '';
                console.log('Current user:', currentUserName, '(' + currentUserEmail + ')');
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            showMondayProgress('Could not fetch user info, importing all items...', 10);
        }
        
        // Update progress
        showMondayProgress('Fetching items from Monday.com...', 15);
        
        // Function to fetch items WITHOUT subitems first (faster)
        const fetchAllItems = async (cursor = null) => {
            const query = `
                query {
                    boards(ids: [${config.boardId}]) {
                        name
                        columns {
                            id
                            title
                            type
                        }
                        items_page(limit: 100${cursor ? `, cursor: "${cursor}"` : ''}) {
                            cursor
                            items {
                                id
                                name
                                column_values {
                                    id
                                    text
                                    value
                                    type
                                }
                            }
                        }
                    }
                }
            `;
            
            const response = await fetch('https://api.monday.com/v2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': config.apiKey
                },
                body: JSON.stringify({ query })
            });
            
            const result = await response.json();
            
            if (result.errors) {
                throw new Error(result.errors[0].message);
            }
            
            return result.data.boards[0];
        };
        
        // Fetch first page
        let board = await fetchAllItems();
        const boardName = board.name;
        const columns = board.columns;
        let allItems = [...board.items_page.items];
        let cursor = board.items_page.cursor;
        
        // Fetch remaining pages if there are more items (max 5 pages to avoid timeout)
        let pageCount = 1;
        const maxPages = 5;
        while (cursor && pageCount < maxPages) {
            try {
                showMondayProgress(`Fetching items... (${allItems.length} found)`, Math.min(20 + (pageCount * 10), 40));
                board = await fetchAllItems(cursor);
                allItems = [...allItems, ...board.items_page.items];
                cursor = board.items_page.cursor;
                pageCount++;
            } catch (error) {
                console.error('Error fetching page:', error);
                showAlert('warning', `Fetched ${allItems.length} items (stopped due to API limit)`);
                break;
            }
        }
        
        if (pageCount >= maxPages && cursor) {
            showAlert('info', `Fetched ${allItems.length} items (limited to ${maxPages} pages)`);
        }
        
        const items = allItems;
        
        // Create a map of column IDs to titles
        const columnMap = {};
        columns.forEach(col => {
            columnMap[col.id] = col.title;
        });
        
        if (!items || items.length === 0) {
            showAlert('warning', 'No items found in the selected board');
            return;
        }
        
        // Phase 2: Fetch subitems for ALL items first, then filter
        showMondayProgress(`Fetching subitems for ${items.length} items...`, 50);
        
        const fetchItemWithSubitems = async (itemId) => {
            try {
                const query = `
                    query {
                        items(ids: [${itemId}]) {
                            id
                            subitems {
                                id
                                name
                                column_values {
                                    id
                                    text
                                    value
                                    type
                                }
                            }
                        }
                    }
                `;
                
                const response = await fetch('https://api.monday.com/v2', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': config.apiKey
                    },
                    body: JSON.stringify({ query }),
                    signal: AbortSignal.timeout(60000) // 60 second timeout per request
                });
                
                const result = await response.json();
                if (result.errors) {
                    console.error('Error fetching subitems for item', itemId, ':', result.errors);
                    return null;
                }
                return result.data.items[0];
            } catch (error) {
                console.error('Timeout or error fetching subitems for item', itemId, ':', error.message);
                return null;
            }
        };
        
        // Fetch subitems for all items with error handling
        const itemsWithSubitems = await Promise.allSettled(
            items.map(item => fetchItemWithSubitems(item.id))
        ).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));
        
        // Merge subitems data back into items
        items.forEach((item, index) => {
            if (itemsWithSubitems[index]) {
                item.subitems = itemsWithSubitems[index].subitems;
            }
        });
        
        showMondayProgress('Filtering items assigned to you...', 75);
        
        // NOW filter items based on People column OR subitem Owner
        const filteredItems = items.filter(item => {
            // If no user email, include all items
            if (!currentUserEmail) {
                return true;
            }
            
            // Check 1: Parent item People column
            const peopleCol = item.column_values.find(col => {
                const title = columnMap[col.id];
                return title && (title.toLowerCase().includes('people') || title.toLowerCase().includes('tam'));
            });
            
            if (peopleCol && peopleCol.text) {
                const textLower = peopleCol.text.toLowerCase();
                const emailLower = currentUserEmail.toLowerCase();
                const nameLower = currentUserName.toLowerCase();
                
                if (textLower.includes(emailLower) || (nameLower && textLower.includes(nameLower))) {
                    console.log('✓ Including', item.name, '- found in People column');
                    return true;
                }
            }
            
            // Check 2: Subitem Owner column
            if (item.subitems && item.subitems.length > 0) {
                for (const subitem of item.subitems) {
                    for (const col of subitem.column_values) {
                        const text = col.text || '';
                        if (text) {
                            const textLower = text.toLowerCase();
                            const emailLower = currentUserEmail.toLowerCase();
                            const nameLower = currentUserName.toLowerCase();
                            
                            if (textLower.includes(emailLower) || (nameLower && textLower.includes(nameLower))) {
                                console.log('✓ Including', item.name, '- found', currentUserName, 'in subitem:', subitem.name);
                                return true;
                            }
                        }
                    }
                }
            }
            
            console.log('✗ Excluding', item.name, '- not assigned to', currentUserName);
            return false;
        });
        
        console.log('Filtered items:', filteredItems.length, 'out of', items.length);
        
        if (filteredItems.length === 0) {
            showAlert('warning', 'No items assigned to you found in the selected board');
            // Re-enable button
            if (importBtn) {
                importBtn.disabled = false;
                importBtn.style.opacity = '1';
                importBtn.style.cursor = 'pointer';
            }
            return;
        }
        
        // Show confirmation with filtered count
        const confirmMessage = `📥 Import FROM Monday.com\n\nBoard: ${boardName}\nBoard ID: ${config.boardId}\n\nFound ${filteredItems.length} items assigned to you (out of ${items.length} total).\n\nContinue with import?`;
        
        if (!confirm(confirmMessage)) {
            // Re-enable button
            if (importBtn) {
                importBtn.disabled = false;
                importBtn.style.opacity = '1';
                importBtn.style.cursor = 'pointer';
            }
            return;
        }
        
        // Extract data from filtered items
        const mondayItems = filteredItems
            .map(item => {
                // Extract the required columns from parent item
                let subitem = '';
                let product = '';
                let douHours = '0';
                let status = '';
                let estimatedStartDate = '';
                let estimatedEndDate = '';
                let workNumber = '';
                let douEndDate = '';
                
                item.column_values.forEach(col => {
                    const title = columnMap[col.id] ? columnMap[col.id].toLowerCase() : '';
                    const text = col.text || '';
                    
                    // Match Status column
                    if (title === 'status' || title.includes('status')) {
                        status = text;
                    }
                    // Match Estimated Start Date
                    else if (title.includes('estimated start date') || title.includes('start date')) {
                        estimatedStartDate = text;
                    }
                    // Match Work Number from PARENT item
                    else if (title.includes('work number')) {
                        workNumber = text;
                    }
                    // Match Estimated End Date from PARENT item
                    else if (title.includes('estimated end date') || (title.includes('end date') && !title.includes('dou'))) {
                        estimatedEndDate = text;
                    }
                });
                
                // Extract hours, DOU end date, DOU numbers, and work numbers from subitems
                console.log('Processing item:', item.name, 'Subitems:', item.subitems ? item.subitems.length : 0);
                if (item.subitems && item.subitems.length > 0) {
                    let totalHours = 0;
                    let endDates = [];
                    let douNumbers = [];
                    let subitemWorkNumbers = [];
                    
                    // First, check if ANY subitem has an Owner column with current user
                    let hasOwnerColumn = false;
                    if (currentUserEmail) {
                        item.subitems.forEach(subitem => {
                            subitem.column_values.forEach(col => {
                                const text = col.text || '';
                                if (text) {
                                    const textLower = text.toLowerCase();
                                    const emailLower = currentUserEmail.toLowerCase();
                                    const nameLower = currentUserName.toLowerCase();
                                    
                                    if (textLower.includes(emailLower) || (nameLower && textLower.includes(nameLower)) || textLower.includes('@')) {
                                        hasOwnerColumn = true;
                                    }
                                }
                            });
                        });
                    }
                    
                    console.log('  Has owner column in subitems:', hasOwnerColumn);
                    
                    if (hasOwnerColumn) {
                        // If subitems have Owner, sum only those assigned to current user
                        item.subitems.forEach(subitem => {
                            console.log('  Subitem:', subitem.name);
                            let isAssignedToMe = false;
                            let subitemHours = 0;
                            let subitemWorkNumber = '';
                            let subitemEndDate = '';
                            let subitemDouNumber = '';
                            let foundHours = false;
                            
                            subitem.column_values.forEach(col => {
                                const text = col.text || '';
                                const title = columnMap[col.id] ? columnMap[col.id].toLowerCase() : '';
                                
                                // Check for Owner/People column
                                if (text && currentUserEmail) {
                                    const textLower = text.toLowerCase();
                                    const emailLower = currentUserEmail.toLowerCase();
                                    const nameLower = currentUserName.toLowerCase();
                                    
                                    if (textLower.includes(emailLower) || (nameLower && textLower.includes(nameLower))) {
                                        console.log('    ✓ Subitem assigned to', currentUserName);
                                        isAssignedToMe = true;
                                    }
                                }
                                
                                // Extract DOU End Date from subitem
                                if (title.includes('dou end date') || title.includes('end date')) {
                                    subitemEndDate = text;
                                }
                                
                                // Extract DOU Number from subitem
                                if (title.includes('dou') && !title.includes('date') && !title.includes('hours') && !title.includes('sum')) {
                                    subitemDouNumber = text;
                                }
                                
                                // Extract Work Number from subitem
                                if (title.includes('work number')) {
                                    subitemWorkNumber = text;
                                }
                                
                                // Look for hours value from "Sum of DOU hours seen in PDF" column
                                if (!foundHours) {
                                    // Skip percentage columns
                                    if (title && (title.includes('%') || title.includes('util') || title.includes('percent'))) {
                                        return; // Skip this column
                                    }
                                    
                                    // Look for "Sum of DOU hours" column specifically
                                    if (title && title.includes('sum') && title.includes('dou') && title.includes('hours')) {
                                        const numValue = parseFloat(text);
                                        if (!isNaN(numValue) && numValue > 0) {
                                            subitemHours = numValue;
                                            foundHours = true;
                                            console.log('    Found hours from "Sum of DOU hours":', numValue);
                                        }
                                    }
                                    // Fallback: Look for any reasonable number (but skip small numbers that might be percentages)
                                    else if (text && text.trim() !== '') {
                                        // Skip if it looks like a date, code, percentage, or text
                                        if (!text.includes('-') && !text.includes('/') && !text.includes('.') && !/[a-zA-Z]/.test(text)) {
                                            const numValue = parseFloat(text);
                                            // Only accept numbers >= 20 to avoid picking up percentages (10%, 15%, etc.)
                                            if (!isNaN(numValue) && numValue >= 20 && numValue <= 10000) {
                                                subitemHours = numValue;
                                                foundHours = true;
                                                console.log('    Found hours (fallback, >= 20):', numValue);
                                            }
                                        }
                                    }
                                }
                            });
                            
                            if (isAssignedToMe && foundHours) {
                                totalHours += subitemHours;
                                if (subitemEndDate) endDates.push(subitemEndDate);
                                if (subitemDouNumber) douNumbers.push(subitemDouNumber);
                                if (subitemWorkNumber) subitemWorkNumbers.push(subitemWorkNumber);
                                console.log('  ✓ Added', subitemHours, 'hours (assigned to me), Work Number:', subitemWorkNumber);
                            }
                        });
                    } else {
                        // If no Owner column, take hours from FIRST subitem only
                        console.log('  No owner column - taking hours from first subitem');
                        const firstSubitem = item.subitems[0];
                        console.log('  First subitem:', firstSubitem.name);
                        
                        firstSubitem.column_values.forEach(col => {
                            const text = col.text || '';
                            const title = columnMap[col.id] ? columnMap[col.id].toLowerCase() : '';
                            
                            // Extract DOU End Date from first subitem
                            if (title.includes('dou end date') || title.includes('end date')) {
                                endDates.push(text);
                            }
                            
                            // Extract DOU Number from first subitem
                            if (title.includes('dou') && !title.includes('date') && !title.includes('hours') && !title.includes('sum')) {
                                douNumbers.push(text);
                            }
                            
                            // Extract Work Number from first subitem
                            if (title.includes('work number')) {
                                subitemWorkNumbers.push(text);
                            }
                            
                            // Skip percentage columns
                            if (title && (title.includes('%') || title.includes('util') || title.includes('percent'))) {
                                return; // Skip this column
                            }
                            
                            // Look for "Sum of DOU hours" column specifically
                            if (title && title.includes('sum') && title.includes('dou') && title.includes('hours')) {
                                const numValue = parseFloat(text);
                                if (!isNaN(numValue) && numValue > 0) {
                                    totalHours = numValue;
                                    console.log('  ✓ Took', numValue, 'hours from first subitem "Sum of DOU hours"');
                                }
                            }
                            // Fallback: Look for any reasonable number (>= 20 to avoid percentages)
                            else if (text && text.trim() !== '' && totalHours === 0) {
                                if (!text.includes('-') && !text.includes('/') && !text.includes('.') && !/[a-zA-Z]/.test(text)) {
                                    const numValue = parseFloat(text);
                                    if (!isNaN(numValue) && numValue >= 20 && numValue <= 10000) {
                                        totalHours = numValue;
                                        console.log('  ✓ Took', numValue, 'hours from first subitem (fallback, >= 20)');
                                    }
                                }
                            }
                        });
                    }
                    
                    douHours = totalHours.toString();
                    douEndDate = endDates.length > 0 ? endDates[0] : ''; // Take first DOU end date from subitems
                    const douNumber = douNumbers.length > 0 ? douNumbers[0] : ''; // Take first DOU number from subitems
                    const subitemWorkNumber = subitemWorkNumbers.length > 0 ? subitemWorkNumbers[0] : ''; // Take first work number from subitems
                    console.log('  Total hours for', item.name, ':', douHours);
                    console.log('  Work Number (from parent):', workNumber);
                    console.log('  Work Number (from subitems):', subitemWorkNumber);
                    console.log('  DOU Number (from subitems):', douNumber);
                    console.log('  DOU End Date:', douEndDate);
                    
                    // Prefer Work Number from parent, fall back to work number from subitems if parent shows "multiple" or contains comma
                    const workNumberLower = workNumber ? workNumber.toLowerCase().trim() : '';
                    const hasMultipleWorkNumbers = workNumberLower === 'multiple' || workNumber.includes(',');
                    
                    if (!workNumber || workNumberLower === '' || hasMultipleWorkNumbers) {
                        // Try subitem work number first, then DOU number
                        if (subitemWorkNumber && subitemWorkNumber.trim() !== '' && subitemWorkNumber.toLowerCase() !== 'multiple' && !subitemWorkNumber.includes(',')) {
                            workNumber = subitemWorkNumber;
                            console.log('  ✓ Using Work Number from subitem (parent had multiple):', subitemWorkNumber);
                        } else if (douNumber && douNumber.trim() !== '' && douNumber.toLowerCase() !== 'multiple' && !douNumber.includes(',')) {
                            workNumber = douNumber;
                            console.log('  ✓ Using DOU Number from subitem (no work number found):', douNumber);
                        } else {
                            console.log('  ⚠ No valid Work Number found (parent:', workNumber, ', subitem WN:', subitemWorkNumber, ', subitem DOU:', douNumber, ')');
                        }
                    } else {
                        console.log('  ✓ Using Work Number from parent:', workNumber);
                    }
                }
                
                // Normalize status to match Projects tab format
                let normalizedStatus = status;
                if (status) {
                    const statusLower = status.toLowerCase();
                    if (statusLower === 'active' || statusLower.includes('assigned')) {
                        normalizedStatus = 'Active';
                    } else if (statusLower === 'done' || statusLower === 'complete' || statusLower === 'completed') {
                        normalizedStatus = 'Done';
                    } else if (statusLower === 'stuck' || statusLower === 'blocked') {
                        normalizedStatus = 'Stuck';
                    } else if (statusLower === 'working on it' || statusLower === 'in progress') {
                        normalizedStatus = 'Working on it';
                    }
                }
                
                return {
                    id: item.id,
                    project: item.name,  // Item name as project
                    name: item.name,
                    subitem: subitem,
                    product: product,
                    hours: douHours,  // Sum of DOU hours as hours
                    douHours: douHours,
                    status: normalizedStatus,
                    estimatedStartDate: estimatedStartDate,
                    estimatedEndDate: douEndDate || estimatedEndDate,  // Use DOU End Date if available
                    workNumber: workNumber,
                    importedAt: new Date().toISOString()
                };
            });
        
        // Save to localStorage
        showMondayProgress('Saving items...', 95);
        localStorage.setItem('mondayItems', JSON.stringify(mondayItems));
        
        // Save last sync timestamp
        localStorage.setItem('mondayLastSync', new Date().toISOString());
        
        // Show completion
        showMondayProgress(`✅ Import complete! ${mondayItems.length} items imported`, 100);
        
        // Refresh the Monday.com items display immediately
        displayMondayItems();
        
        // Hide progress and show success alert after 2 seconds
        setTimeout(() => {
            hideMondayProgress();
            showAlert('success', `Successfully imported ${mondayItems.length} items from Monday.com`);
        }, 2000);
        
        // Add to sync history
        addToSyncHistory('Import FROM Monday.com', mondayItems.length, 'Success');
        
    } catch (error) {
        console.error('Import error:', error);
        hideMondayProgress();
        showAlert('error', `Failed to import from Monday.com: ${error.message}`);
        
        // Add failed import to sync history
        addToSyncHistory('Import FROM Monday.com', 0, 'Failed');
    } finally {
        // Re-enable buttons
        const importBtn = document.getElementById('importMondayItems');
        if (importBtn) {
            importBtn.disabled = false;
            importBtn.style.opacity = '1';
            importBtn.style.cursor = 'pointer';
        }
    }
}

// Sync entries to Monday.com
async function syncToMonday() {
    const config = loadMondayConfig();
    
    if (!config || !config.apiKey) {
        alert('Please configure Monday.com integration first');
        return;
    }
    
    if (!config.boardId) {
        alert('Please select a board first');
        return;
    }
    
    const entries = getWorkEntries();
    
    if (entries.length === 0) {
        alert('No work tasks to sync');
        return;
    }
    
    const boardName = config.boardName || `Board ${config.boardId}`;
    const confirmMessage = `📤 Sync TO Monday.com\n\nBoard: ${boardName}\nBoard ID: ${config.boardId}\n\nThis will sync ${entries.length} work tasks to this board.\n\nContinue?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    alert('🔄 Syncing to Monday.com...\n\nThis feature requires Monday.com board structure setup.\n\nFor now, this is a placeholder. Full implementation would:\n\n1. Create items in Monday.com board\n2. Map work task fields to board columns\n3. Track sync status\n4. Handle errors and retries');
    
    // Placeholder for actual sync logic
    // In a real implementation, you would:
    // 1. Create items in the Monday.com board
    // 2. Map your work entry fields to Monday.com columns
    // 3. Handle errors and retries
    // 4. Update sync history
}

// Disconnect Monday.com
function disconnectMonday() {
    if (!confirm('Disconnect from Monday.com?\n\nThis will remove your saved configuration.')) {
        return;
    }
    
    localStorage.removeItem(MONDAY_CONFIG_KEY);
    
    const statusIndicator = document.getElementById('mondayIndicator');
    const statusText = document.getElementById('mondayStatusText');
    const syncActions = document.getElementById('mondaySyncActions');
    const boardsContainer = document.getElementById('mondayBoards');
    const boardSelector = document.getElementById('boardSelector');
    const selectedBoardInfo = document.getElementById('selectedBoardInfo');
    
    statusIndicator.textContent = '⚪';
    statusText.textContent = 'Not Connected';
    syncActions.style.display = 'none';
    if (boardSelector) boardSelector.style.display = 'none';
    if (selectedBoardInfo) selectedBoardInfo.style.display = 'none';
    boardsContainer.style.display = 'none';
    
    document.getElementById('mondayApiKey').value = '';
    document.getElementById('mondayBoardId').value = '';
    
    alert('✅ Disconnected from Monday.com');
}

// Monday.com Items Management
let mondayCurrentPage = 1;
const mondayItemsPerPage = 10;

function getMondayItems() {
    const items = localStorage.getItem('mondayItems');
    if (!items) return [];
    
    const parsedItems = JSON.parse(items);
    
    // Migrate old status values to normalized format
    const migratedItems = parsedItems.map(item => {
        if (item.status) {
            const statusLower = item.status.toLowerCase();
            if (statusLower === 'active' || statusLower.includes('assigned')) {
                item.status = 'Active';
            } else if (statusLower === 'done' || statusLower === 'complete' || statusLower === 'completed') {
                item.status = 'Done';
            } else if (statusLower === 'stuck' || statusLower === 'blocked') {
                item.status = 'Stuck';
            } else if (statusLower === 'working on it' || statusLower === 'in progress') {
                item.status = 'Working on it';
            }
        }
        return item;
    });
    
    // Save migrated data back
    if (JSON.stringify(parsedItems) !== JSON.stringify(migratedItems)) {
        localStorage.setItem('mondayItems', JSON.stringify(migratedItems));
    }
    
    return migratedItems;
}

function displayMondayItems(searchTerm = '', sortBy = 'status') {
    let items = getMondayItems();
    const tbody = document.getElementById('mondayItemsBody');
    const paginationDiv = document.getElementById('mondayPagination');
    
    // Update last sync display
    updateLastSyncDisplay();
    
    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <p>No Monday.com items imported yet</p>
                    <p class="empty-hint">Click "Import Items" to fetch items from your Monday.com board</p>
                </td>
            </tr>
        `;
        updateMondayStats(0, 0, 0, 0);
        if (paginationDiv) paginationDiv.style.display = 'none';
        return;
    }
    
    // Apply search filter
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        items = items.filter(item => {
            const project = (item.project || item.name || '').toLowerCase();
            const status = (item.status || '').toLowerCase();
            const workNumber = (item.workNumber || '').toLowerCase();
            return project.includes(term) || status.includes(term) || workNumber.includes(term);
        });
    }
    
    // Apply sorting
    items.sort((a, b) => {
        if (sortBy === 'status') {
            // Active items first
            const aStatus = (a.status || '').toLowerCase();
            const bStatus = (b.status || '').toLowerCase();
            const aIsActive = aStatus.includes('active') || aStatus.includes('assigned');
            const bIsActive = bStatus.includes('active') || bStatus.includes('assigned');
            
            if (aIsActive && !bIsActive) return -1;
            if (!aIsActive && bIsActive) return 1;
            return (a.project || '').localeCompare(b.project || '');
        } else if (sortBy === 'project') {
            return (a.project || a.name || '').localeCompare(b.project || b.name || '');
        } else if (sortBy === 'hours') {
            const aHours = parseFloat(a.hours || a.douHours) || 0;
            const bHours = parseFloat(b.hours || b.douHours) || 0;
            return bHours - aHours;
        } else if (sortBy === 'startDate') {
            return (a.estimatedStartDate || '').localeCompare(b.estimatedStartDate || '');
        } else if (sortBy === 'endDate') {
            return (a.estimatedEndDate || '').localeCompare(b.estimatedEndDate || '');
        }
        return 0;
    });
    
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <p>No items match your search</p>
                </td>
            </tr>
        `;
        updateMondayStats(0, 0, 0, 0);
        if (paginationDiv) paginationDiv.style.display = 'none';
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(items.length / mondayItemsPerPage);
    const startIndex = (mondayCurrentPage - 1) * mondayItemsPerPage;
    const endIndex = startIndex + mondayItemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);
    
    // Show/hide pagination
    if (paginationDiv) {
        if (totalPages > 1) {
            paginationDiv.style.display = 'flex';
            document.getElementById('mondayPageInfo').textContent = `Page ${mondayCurrentPage} of ${totalPages}`;
            document.getElementById('mondayPrevBtn').disabled = mondayCurrentPage === 1;
            document.getElementById('mondayNextBtn').disabled = mondayCurrentPage === totalPages;
        } else {
            paginationDiv.style.display = 'none';
        }
    }
    
    tbody.innerHTML = paginatedItems.map((item, index) => {
        const actualIndex = startIndex + index;
        // Format status with color
        let statusBadge = '-';
        if (item.status) {
            const statusLower = item.status.toLowerCase();
            let statusClass = 'status-default';
            if (statusLower.includes('active') || statusLower.includes('assigned')) {
                statusClass = 'status-active';
            } else if (statusLower.includes('complete') || statusLower.includes('done')) {
                statusClass = 'status-complete';
            } else if (statusLower.includes('pending') || statusLower.includes('waiting')) {
                statusClass = 'status-pending';
            }
            statusBadge = `<span class="status-badge ${statusClass}">${item.status}</span>`;
        }
        
        const rowId = `monday-row-${actualIndex}`;
        const detailsId = `monday-details-${actualIndex}`;
        
        return `
            <tr class="project-row" id="${rowId}">
                <td>
                    <button class="expand-btn" onclick="toggleMondayDetails('${rowId}', '${detailsId}')">
                        <span class="expand-icon">▶</span>
                    </button>
                </td>
                <td>${actualIndex + 1}</td>
                <td><strong>${item.project || item.name || '-'}</strong></td>
                <td><strong>${item.hours || item.douHours || '0'}</strong></td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-icon" onclick="window.addMondayItemToProject('${item.id}')" title="Add to Projects">
                        ➕
                    </button>
                    <button class="btn-icon" onclick="window.deleteMondayItem('${item.id}')" title="Delete">
                        🗑️
                    </button>
                </td>
            </tr>
            <tr class="details-row" id="${detailsId}" style="display: none;">
                <td colspan="6">
                    <div class="details-content-professional">
                        <div class="details-row-1">
                            <div class="detail-inline">
                                <span class="detail-label">Work Number:</span>
                                <span class="detail-value">${item.workNumber || '-'}</span>
                            </div>
                            <div class="detail-inline">
                                <span class="detail-label">Start Date:</span>
                                <span class="detail-value">${item.estimatedStartDate || '-'}</span>
                            </div>
                            <div class="detail-inline">
                                <span class="detail-label">End Date:</span>
                                <span class="detail-value">${item.estimatedEndDate || '-'}</span>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    // Calculate stats from all items (not just paginated)
    const activeProjects = new Set();
    let totalHours = 0;
    const statusSet = new Set();
    
    items.forEach(item => {
        const status = (item.status || '').toLowerCase();
        if (status.includes('active') || status.includes('assigned')) {
            const projectName = item.project || item.name || '';
            if (projectName) {
                activeProjects.add(projectName);
            }
        }
        
        // Sum total hours
        const hours = parseFloat(item.hours || item.douHours) || 0;
        totalHours += hours;
        
        // Collect unique statuses
        if (item.status) {
            statusSet.add(item.status);
        }
    });
    
    updateMondayStats(items.length, totalHours, activeProjects.size, statusSet.size);
}

// Pagination functions for Monday.com
function changeMondayPage(direction) {
    const items = getMondayItems();
    const totalPages = Math.ceil(items.length / mondayItemsPerPage);
    
    mondayCurrentPage += direction;
    
    // Ensure page is within bounds
    if (mondayCurrentPage < 1) mondayCurrentPage = 1;
    if (mondayCurrentPage > totalPages) mondayCurrentPage = totalPages;
    
    // Get current search and sort values
    const searchTerm = document.getElementById('searchMondayItems')?.value || '';
    const sortBy = document.getElementById('sortMondayItems')?.value || 'status';
    
    // Refresh display
    displayMondayItems(searchTerm, sortBy);
}

function updateMondayStats(total, totalHours, activeProjects, statusCount) {
    document.getElementById('mondayTotalItems').textContent = total;
    const totalHoursEl = document.getElementById('mondayTotalHours');
    if (totalHoursEl) totalHoursEl.textContent = totalHours.toFixed(1);
    document.getElementById('mondayActiveProjects').textContent = activeProjects;
    const statusCountEl = document.getElementById('mondayStatusCount');
    if (statusCountEl) statusCountEl.textContent = statusCount > 0 ? statusCount : '-';
}

function updateLastSyncDisplay() {
    const lastSyncTimestamp = localStorage.getItem('mondayLastSync');
    const lastSyncInfo = document.getElementById('mondayLastSyncInfo');
    const lastSyncTime = document.getElementById('mondayLastSyncTime');
    
    if (!lastSyncTimestamp) {
        if (lastSyncInfo) lastSyncInfo.style.display = 'none';
        return;
    }
    
    const syncDate = new Date(lastSyncTimestamp);
    const now = new Date();
    const diffMs = now - syncDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    let timeAgo;
    if (diffMins < 1) {
        timeAgo = 'Just now';
    } else if (diffMins < 60) {
        timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
        timeAgo = syncDate.toLocaleDateString() + ' ' + syncDate.toLocaleTimeString();
    }
    
    if (lastSyncTime) lastSyncTime.textContent = timeAgo;
    if (lastSyncInfo) lastSyncInfo.style.display = 'flex';
}

function viewMondayItem(itemId) {
    const items = getMondayItems();
    const item = items.find(i => i.id === itemId);
    
    if (!item) {
        alert('Item not found');
        return;
    }
    
    alert(`📋 Monday.com Item Details\n\nItem: ${item.name}\nSubitem: ${item.subitem || 'N/A'}\nProduct: ${item.product || 'N/A'}\nDOU Hours: ${item.douHours || '0'}\n\nImported: ${new Date(item.importedAt).toLocaleString()}`);
}

function deleteMondayItem(itemId) {
    if (!confirm('Delete this Monday.com item?\n\nThis will only remove it from local storage, not from Monday.com.')) {
        return;
    }
    
    let items = getMondayItems();
    items = items.filter(i => i.id !== itemId);
    localStorage.setItem('mondayItems', JSON.stringify(items));
    displayMondayItems();
    showAlert('success', 'Item deleted successfully');
}

function clearMondayItems() {
    const items = getMondayItems();
    
    if (items.length === 0) {
        showAlert('info', 'No Monday.com items to clear');
        return;
    }
    
    if (!confirm(`Clear all ${items.length} Monday.com items?\n\nThis will remove all imported items from local storage. You can re-import them anytime.\n\nThis action cannot be undone!`)) {
        return;
    }
    
    localStorage.removeItem('mondayItems');
    displayMondayItems();
    showAlert('success', `Cleared ${items.length} Monday.com items successfully!`);
}

// Fetch and display user info from Monday.com
async function fetchAndDisplayUserInfo() {
    // Only fetch from API when explicitly called (e.g., after connection test)
    const config = loadMondayConfig();
    
    if (!config || !config.apiKey) {
        return;
    }
    
    try {
        const userQuery = `query { me { id name email } }`;
        const response = await fetch('https://api.monday.com/v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': config.apiKey,
                'API-Version': '2024-01'
            },
            body: JSON.stringify({ query: userQuery })
        });
        
        const data = await response.json();
        if (data.data && data.data.me) {
            const userName = data.data.me.name || 'User';
            const userEmail = data.data.me.email || 'Not available';
            
            updateUserInfoDisplay(userName, userEmail);
            
            // Store for later use
            localStorage.setItem('mondayUserInfo', JSON.stringify({
                name: userName,
                email: userEmail
            }));
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
    }
}

// Helper function to update user info in UI
function updateUserInfoDisplay(userName, userEmail) {
    console.log('Updating user info display:', userName, userEmail);
    
    // Extract name from email if userName looks like an email
    let displayName = userName;
    if (userName.includes('@')) {
        // Extract name part before @ and format it
        const namePart = userName.split('@')[0];
        // Convert "soumya.pai" to "Soumya Pai"
        displayName = namePart.split('.').map(part =>
            part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join(' ');
    }
    
    // Update home screen
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = displayName.split(' ')[0]; // First name only
        console.log('Updated home screen name to:', displayName.split(' ')[0]);
    } else {
        console.warn('userName element not found');
    }
    
    // Update settings
    const settingsUserName = document.getElementById('settingsUserName');
    const settingsUserEmail = document.getElementById('settingsUserEmail');
    
    if (settingsUserName) {
        settingsUserName.textContent = userName;
        console.log('Updated settings name');
    } else {
        console.warn('settingsUserName element not found');
    }
    
    if (settingsUserEmail) {
        settingsUserEmail.textContent = userEmail;
        console.log('Updated settings email');
    } else {
        console.warn('settingsUserEmail element not found');
    }
}

// Normalize status to proper case (Active, Deactive, Temporary)
function normalizeStatus(status) {
    if (!status) return 'Active';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower === 'active' || statusLower === 'assigned') return 'Active';
    if (statusLower === 'deactive' || statusLower === 'inactive') return 'Deactive';
    if (statusLower === 'temporary') return 'Temporary';
    
    // Default to Active for unknown statuses
    return 'Active';
}

// Add single Monday.com item to Projects with pre-populated modal
function addMondayItemToProject(itemId) {
    const mondayItems = getMondayItems();
    const item = mondayItems.find(i => i.id === itemId);
    
    if (!item) {
        showAlert('error', 'Item not found');
        return;
    }
    
    // Check if project already exists
    const projects = getProjectsData();
    const exists = projects.some(p =>
        p.account.toLowerCase() === item.project.toLowerCase()
    );
    
    if (exists) {
        showMondayMessage(`Project "${item.project}" already exists in Projects tab.`, 'info');
        return;
    }
    
    // Switch to Projects tab first
    switchView('projects');
    
    // Open project modal with pre-populated data using correct field IDs
    const modal = document.getElementById('projectModal');
    const form = document.getElementById('projectForm');
    const claimedHoursGroup = document.getElementById('claimedHoursGroup');
    
    // Reset form first
    form.reset();
    
    // Set mode to add
    document.getElementById('editProjectAccount').value = '';
    
    // Update modal title
    document.getElementById('projectModalTitle').textContent = 'Add Project from Monday.com';
    document.getElementById('submitProjectBtn').textContent = 'Add Project';
    
    // Pre-populate form fields with CORRECT field IDs and normalize status
    document.getElementById('projectAccount').value = item.project;
    document.getElementById('projectCode').value = item.workNumber || '';
    document.getElementById('projectStatus').value = normalizeStatus(item.status);
    document.getElementById('projectTotalHours').value = item.hours || '0';
    
    // Set dates if available
    if (item.estimatedStartDate) {
        document.getElementById('projectStartDate').value = item.estimatedStartDate;
    }
    if (item.estimatedEndDate) {
        document.getElementById('projectEndDate').value = item.estimatedEndDate;
    }
    
    // Hide claimed hours for add mode
    if (claimedHoursGroup) {
        claimedHoursGroup.style.display = 'none';
    }
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Make functions globally available
window.viewMondayItem = viewMondayItem;
window.deleteMondayItem = deleteMondayItem;
window.clearMondayItems = clearMondayItems;
window.openProjectModal = openProjectModal;
window.editProject = editProject;
window.deleteProject = deleteProject;
window.addMondayItemToProject = addMondayItemToProject;

// Initialize Monday.com integration on page load
async function initializeMondayIntegration() {
    // Add event listeners FIRST - before any async operations
    // This ensures buttons work even if there are errors in initialization
    try {
        document.getElementById('testMondayConnection').addEventListener('click', testMondayConnection);
        document.getElementById('mondayConfigForm').addEventListener('submit', handleMondayConfigSubmit);
        document.getElementById('importFromMonday').addEventListener('click', importFromMonday);
        document.getElementById('disconnectMonday').addEventListener('click', disconnectMonday);
    } catch (error) {
        console.error('Error attaching event listeners:', error);
    }
    
    // Now handle existing configuration
    const config = loadMondayConfig();
    
    if (config && config.apiKey) {
        const statusIndicator = document.getElementById('mondayIndicator');
        const statusText = document.getElementById('mondayStatusText');
        const syncActions = document.getElementById('mondaySyncActions');
        const boardSelector = document.getElementById('boardSelector');
        
        statusIndicator.textContent = '🟢';
        statusText.textContent = 'Connected';
        
        document.getElementById('mondayApiKey').value = config.apiKey;
        if (config.boardId) {
            document.getElementById('mondayBoardId').value = config.boardId;
        }
        
        // If a board is already selected, just show it (don't fetch all boards)
        if (config.boardId && config.boardName) {
            const selectedBoardInfo = document.getElementById('selectedBoardInfo');
            const selectedBoardName = document.getElementById('selectedBoardName');
            const selectedBoardId = document.getElementById('selectedBoardId');
            
            selectedBoardName.textContent = config.boardName;
            selectedBoardId.textContent = `(ID: ${config.boardId})`;
            selectedBoardInfo.style.display = 'flex';
            
            // Show board selector but don't fetch boards automatically
            const boardSelector = document.getElementById('boardSelector');
            if (boardSelector) {
                boardSelector.style.display = 'block';
            }
        }
        // Don't fetch boards automatically - user must click "Test Connection" button
    }
}

// Make functions globally available
window.selectMondayBoard = selectMondayBoard;

// Sync History Management
function addToSyncHistory(action, taskCount, status) {
    const syncHistory = getSyncHistory();
    
    const entry = {
        date: new Date().toISOString(),
        action: action,
        tasks: taskCount,
        status: status
    };
    
    syncHistory.unshift(entry); // Add to beginning
    
    // Keep only last 50 entries
    if (syncHistory.length > 50) {
        syncHistory.splice(50);
    }
    
    localStorage.setItem('syncHistory', JSON.stringify(syncHistory));
    updateSyncHistoryDisplay();
}

function getSyncHistory() {
    const history = localStorage.getItem('syncHistory');
    return history ? JSON.parse(history) : [];
}

function updateSyncHistoryDisplay() {
    const tbody = document.getElementById('syncHistoryBody');
    if (!tbody) return;
    
    const history = getSyncHistory();
    
    if (history.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <p>No sync history yet</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = history.map(entry => {
        const date = new Date(entry.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        const statusClass = entry.status === 'Success' ? 'status-completed' : 'status-pending';
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${entry.action}</td>
                <td>${entry.tasks}</td>
                <td><span class="status-badge ${statusClass}">${entry.status}</span></td>
            </tr>
        `;
    }).join('');
}

// Initialize sync history display when settings view is loaded
function initializeSyncHistory() {
    updateSyncHistoryDisplay();
}
// Show message in Monday.com view
function showMondayMessage(message, type = 'info') {
    const messageBox = document.getElementById('mondayMessageBox');
    const messageText = document.getElementById('mondayMessageText');
    
    if (!messageBox || !messageText) return;
    
    // Set message text
    messageText.textContent = message;
    
    // Remove all type classes
    messageBox.classList.remove('info', 'success', 'warning', 'error');
    
    // Add the appropriate type class
    messageBox.classList.add(type);
    
    // Show the message box
    messageBox.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageBox.style.display = 'none';
    }, 5000);
}
// Toggle Monday.com item details
function toggleMondayDetails(rowId, detailsId) {
    const row = document.getElementById(rowId);
    const detailsRow = document.getElementById(detailsId);
    const expandBtn = row.querySelector('.expand-btn');
    const expandIcon = expandBtn.querySelector('.expand-icon');
    
    if (detailsRow.style.display === 'none' || !detailsRow.style.display) {
        detailsRow.style.display = 'table-row';
        expandIcon.textContent = '▼';
        row.classList.add('expanded');
    } else {
        detailsRow.style.display = 'none';
        expandIcon.textContent = '▶';
        row.classList.remove('expanded');
    }
}

// Make function globally accessible
window.toggleMondayDetails = toggleMondayDetails;


