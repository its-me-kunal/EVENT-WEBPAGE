document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("loggedIn") === "true") {
        showMainContent();
    }
});

function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    
    if (!username || !password) {
        document.getElementById("login-error").textContent = "Please enter both username and password";
        return;
    }
    
    // Clear any previous error
    document.getElementById("login-error").textContent = "";
    
    fetch("https://www.phoenixreaperesports.com/api/auth/admin", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Login failed");
        }
        return response.json();
    })
    .then(data => {
        // Store auth data
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("adminToken", data.token);
        
        // Display the main content
        document.getElementById("login-container").style.display = "none";
        document.getElementById("main-content").style.display = "block";
        document.getElementById("logout-btn").style.display = "block";
        
        // Load tournaments
        if (typeof loadAllTournaments === 'function') {
            loadAllTournaments();
        }
    })
    .catch(error => {
        console.error("Login error:", error);
        document.getElementById("login-error").textContent = "Invalid username or password";
    });
}

function showMainContent() {
    document.getElementById("login-container").style.display = "none";
    document.getElementById("main-content").style.display = "block";
    
    // Show logout button
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.style.display = "block";
    }
    
    const role = localStorage.getItem("role");
    
    if (role === "admin") {
        // Hide regular content and show admin panel
        document.querySelector('.hero').style.display = 'none';
        document.querySelector('#tournaments-section').style.display = 'none';
        document.querySelector('.features').style.display = 'none';
        
        // Create and show admin panel if it doesn't exist
        let adminPanel = document.getElementById('admin-panel');
        if (!adminPanel) {
            adminPanel = document.createElement('div');
            adminPanel.id = 'admin-panel';
            adminPanel.className = 'admin-panel';
            adminPanel.innerHTML = `
                <h2 class="section-title">Admin Panel</h2>
                <div class="admin-actions">
                    <button class="btn" onclick="showCreateEventForm()">Create New Tournament</button>
                    <button class="btn" onclick="showManageEvents()">Manage Tournaments</button>
                </div>
                <div id="admin-content"></div>
            `;
            document.querySelector('.main-content').appendChild(adminPanel);
        }
        adminPanel.style.display = 'block';
        
        // Load admin dashboard
        loadAdminDashboard();
    } else {
        // Show regular content for normal users
        document.querySelector('.hero').style.display = 'block';
        document.querySelector('#tournaments-section').style.display = 'block';
        document.querySelector('.features').style.display = 'block';
        
        // Hide admin panel if it exists
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.style.display = 'none';
        }
        
        // Load tournaments for regular users
        if (typeof loadAllTournaments === 'function') {
            loadAllTournaments();
        } else {
            console.log("Loading tournaments function not available");
            loadEvents();
        }
    }
}

function loadEvents() {
    fetch("http://localhost:3000/api/events")
        .then(response => response.json())
        .then(events => {
            const eventList = document.getElementById("event-list");
            eventList.innerHTML = ""; // Clear previous events before loading new ones

            if (events.length === 0) {
                eventList.innerHTML = "<p>No upcoming events available.</p>";
                return;
            }

            events.forEach(event => {
                const eventCard = `
                    <div class='event-card'>
                        <h3>${event.title}</h3>
                        <p>${event.description}</p>
                        <p><strong>Date:</strong> ${event.date}</p>
                        <button class='btn'>Register</button>
                    </div>`;
                eventList.insertAdjacentHTML("beforeend", eventCard);
            });
        })
        .catch(error => console.error("Error loading events:", error));
}

function logout() {
    // Clear local storage
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("adminToken");
    
    // Hide main content and show login
    document.getElementById("main-content").style.display = "none";
    document.getElementById("logout-btn").style.display = "none";
    document.getElementById("login-container").style.display = "flex";
    
    // Reset any form errors
    document.getElementById("login-error").textContent = "";
    
    // Switch to user login tab
    switchTab('user');
}

// Handle Google Sign-In response
function handleCredentialResponse(response) {
    console.log("Google Sign-In response received");
    
    // The ID token you need to pass to your backend
    const idToken = response.credential;
    
    // Verify the token with your backend
    fetch("https://www.phoenixreaperesports.com/api/auth/google", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Authentication failed");
        }
        return response.json();
    })
    .then(data => {
        // Store auth data
        localStorage.setItem("loggedIn", "true");
        localStorage.setItem("userEmail", data.email);
        if (data.isAdmin) {
            localStorage.setItem("isAdmin", "true");
        }
        
        // Display the main content
        document.getElementById("login-container").style.display = "none";
        document.getElementById("main-content").style.display = "block";
        document.getElementById("logout-btn").style.display = "block";
        
        // Load tournaments
        if (typeof loadAllTournaments === 'function') {
            loadAllTournaments();
        }
    })
    .catch(error => {
        console.error("Authentication error:", error);
        document.getElementById("login-error").textContent = "Authentication failed. Please try again.";
    });
}

// Add admin dashboard functions
function loadAdminDashboard() {
    const adminContent = document.getElementById('admin-content');
    adminContent.innerHTML = `
        <div class="admin-stats">
            <div class="stat-card">
                <h3>Total Tournaments</h3>
                <p id="total-tournaments">Loading...</p>
            </div>
            <div class="stat-card">
                <h3>Active Tournaments</h3>
                <p id="active-tournaments">Loading...</p>
            </div>
            <div class="stat-card">
                <h3>Total Registrations</h3>
                <p id="total-registrations">Loading...</p>
            </div>
        </div>
    `;
    
    // Load admin statistics
    fetchAdminStats();
}

function fetchAdminStats() {
    const totalTournamentsEl = document.getElementById('total-tournaments');
    const activeTournamentsEl = document.getElementById('active-tournaments');
    const totalRegistrationsEl = document.getElementById('total-registrations');

    // Show loading state
    totalTournamentsEl.textContent = 'Loading...';
    activeTournamentsEl.textContent = 'Loading...';
    totalRegistrationsEl.textContent = 'Loading...';

    // Get the admin token
    const token = localStorage.getItem("token");
    console.log("Using token for stats:", token ? "Token exists" : "No token found");

    fetch("http://localhost:3000/api/admin/stats", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })
        .then(response => {
            console.log("Stats response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Stats data received:", data);
            if (data.success) {
                totalTournamentsEl.textContent = data.totalTournaments || 0;
                activeTournamentsEl.textContent = data.activeTournaments || 0;
                totalRegistrationsEl.textContent = data.totalRegistrations || 0;
            } else {
                throw new Error(data.message || 'Failed to fetch statistics');
            }
        })
        .catch(error => {
            console.error("Error loading admin stats:", error);
            totalTournamentsEl.textContent = 'Error';
            activeTournamentsEl.textContent = 'Error';
            totalRegistrationsEl.textContent = 'Error';
            
            // Show error notification
            showNotification('Failed to load admin statistics. Please try again.', 'error');
        });
}

function showCreateEventForm() {
    const adminContent = document.getElementById('admin-content');
    adminContent.innerHTML = `
        <div class="create-event-form">
            <h3>Create New Tournament</h3>
            <form id="create-tournament-form" onsubmit="createTournament(event)">
                <input type="text" id="title" placeholder="Tournament Title" required>
                <textarea id="description" placeholder="Tournament Description" required></textarea>
                
                <div class="form-group">
                    <label for="tournamentPoster">Tournament Poster (Image URL or upload)</label>
                    <input type="text" id="tournamentPoster" placeholder="Tournament Poster URL">
                    <input type="file" id="tournamentPosterUpload" accept="image/*">
                </div>
                
                <div class="form-group">
                    <label for="roadmapPoster">Roadmap Poster (Image URL or upload)</label>
                    <input type="text" id="roadmapPoster" placeholder="Roadmap Poster URL">
                    <input type="file" id="roadmapPosterUpload" accept="image/*">
                </div>
                
                <div class="form-group">
                    <label for="prizePoolPoster">Prize Pool Distribution Poster (Image URL or upload)</label>
                    <input type="text" id="prizePoolPoster" placeholder="Prize Pool Poster URL">
                    <input type="file" id="prizePoolPosterUpload" accept="image/*">
                </div>
                
                <input type="datetime-local" id="startDate" required>
                <input type="datetime-local" id="endDate" required>
                <input type="number" id="maxTeams" placeholder="Maximum Teams" required>
                <input type="number" id="entryFee" placeholder="Entry Fee" value="0">
                <input type="number" id="prizePool" placeholder="Prize Pool" required>
                <textarea id="rules" placeholder="Tournament Rules" required></textarea>
                <div class="form-buttons">
                    <button type="button" class="btn back-btn" onclick="showAdminDashboard()">Cancel</button>
                <button type="submit" class="btn">Create Tournament</button>
                </div>
            </form>
        </div>
    `;
    
    // Set up file upload handlers
    document.getElementById('tournamentPosterUpload').addEventListener('change', handleFileUpload);
    document.getElementById('roadmapPosterUpload').addEventListener('change', handleFileUpload);
    document.getElementById('prizePoolPosterUpload').addEventListener('change', handleFileUpload);
}

function showManageEvents() {
    const adminContent = document.getElementById('admin-content');
    adminContent.innerHTML = `
        <div class="manage-events">
            <h3>Manage Tournaments</h3>
            <button class="btn download-all-btn" onclick="downloadRegistrations()">
                <i class="fas fa-download"></i> Download All Registrations
            </button>
            <div id="admin-event-list" class="admin-event-grid">
                Loading tournaments...
            </div>
        </div>
    `;
    
    // Load tournaments for admin management
    loadAdminTournaments();
}

function loadAdminTournaments() {
    // Get the admin token
    const token = localStorage.getItem("token");
    console.log("Using token for loading tournaments:", token ? "Token exists" : "No token found");

    fetch("http://localhost:3000/api/tournaments", {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        }
    })
        .then(response => {
            console.log("Tournaments response status:", response.status);
            return response.json();
        })
        .then(tournaments => {
            const eventList = document.getElementById("admin-event-list");
            eventList.innerHTML = "";

            if (tournaments.length === 0) {
                eventList.innerHTML = "<p>No tournaments available.</p>";
                return;
            }

            tournaments.forEach(tournament => {
                const eventCard = createAdminEventCard(tournament);
                eventList.insertAdjacentHTML("beforeend", eventCard.outerHTML);
            });
        })
        .catch(error => {
            console.error("Error loading admin tournaments:", error);
            document.getElementById("admin-event-list").innerHTML = "<p>Error loading tournaments.</p>";
        });
}

function createAdminEventCard(tournament) {
    // Format the date for display
    const startDate = new Date(tournament.startDate);
    const formattedDate = startDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    // Create the card element
    const card = document.createElement('div');
    card.className = 'event-card admin-event-card';
    card.style = 'background: rgba(255, 255, 255, 0.05) !important; backdrop-filter: blur(10px) !important;';
    
    // Add poster image if available
    const posterHTML = tournament.tournamentPoster 
        ? `<div class="event-poster"><img src="${tournament.tournamentPoster}" alt="${tournament.title} Poster"></div>` 
        : '';
    
    // Set the inner HTML with all tournament details
    card.innerHTML = `
        ${posterHTML}
        <div class="event-info" style="background: transparent !important;">
            <h3 style="color: #ff4500 !important; font-weight: 600 !important;">${tournament.title || 'Unnamed Tournament'}</h3>
            <p class="event-desc">${tournament.description || 'No description available'}</p>
            
            <div class="event-details">
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
        </div>
                <div class="detail-item">
                    <i class="fas fa-users"></i>
                    <span>${tournament.registeredTeams || 0}/${tournament.maxTeams || 16} Teams</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-trophy"></i>
                    <span>₹${tournament.prizePool || 0}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clipboard-check"></i>
                    <span class="registration-status ${tournament.registrationOpen ? 'open' : 'closed'}">
                        ${tournament.registrationOpen ? 'Open' : 'Closed'}
                    </span>
                </div>
            </div>
            
        <div class="admin-event-actions">
                <button class="btn view-btn" onclick="viewRegistrations('${tournament._id || tournament.id}')">
                    <i class="fas fa-users"></i> View Teams
            </button>
                <button class="btn edit-btn" onclick="editTournament('${tournament._id || tournament.id}')">
                    <i class="fas fa-edit"></i> Edit
            </button>
                <button class="btn stage-btn" onclick="showStagesModal('${tournament._id || tournament.id}')">
                    <i class="fas fa-sitemap"></i> Manage Stages
            </button>
                <button class="btn toggle-btn ${tournament.registrationOpen ? 'close-reg' : 'open-reg'}" 
                        onclick="toggleRegistration('${tournament._id || tournament.id}')">
                    <i class="fas fa-${tournament.registrationOpen ? 'lock' : 'lock-open'}"></i>
                    ${tournament.registrationOpen ? 'Close' : 'Open'}
            </button>
                <button class="btn delete-btn" onclick="deleteTournament('${tournament._id || tournament.id}')">
                    <i class="fas fa-trash"></i> Delete
            </button>
            </div>
        </div>
    `;

    return card;
}

async function toggleRegistration(tournamentId) {
    try {
        // Get the admin token
        const token = localStorage.getItem("token");
        console.log("Using token for toggling registration:", token ? "Token exists" : "No token found");

        const response = await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/toggle-registration`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Toggle registration response status:", response.status);
        const data = await response.json();
        if (data.success) {
            showNotification(data.message, 'success');
            // Reload the tournaments list instead of just the dashboard
            showManageEvents();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        console.error('Error toggling registration:', error);
        showNotification('Failed to toggle registration status', 'error');
    }
}

function showStagesModal(tournamentId) {
    // Get the admin token
    const token = localStorage.getItem("token");
    console.log("Using token for showing stages modal:", token ? "Token exists" : "No token found");

    // First fetch the tournament details
    fetch(`http://localhost:3000/api/tournaments/${tournamentId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log("Tournament fetch response status:", response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(tournament => {
        console.log("Tournament data for stages:", tournament);
        
        // Create the modal
    const modal = document.createElement('div');
    modal.className = 'modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        modal.style.zIndex = '1000';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.overflowY = 'auto';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.backgroundColor = '#222';
        modalContent.style.padding = '30px';
        modalContent.style.borderRadius = '10px';
        modalContent.style.width = '80%';
        modalContent.style.maxWidth = '900px';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflowY = 'auto';
        modalContent.style.position = 'relative';
        
        modalContent.innerHTML = `
            <span class="close-modal" style="position: absolute; top: 10px; right: 15px; color: white; font-size: 24px; cursor: pointer;">&times;</span>
            <h2 style="color: #ff4500; margin-bottom: 20px;">Manage Tournament Stages for ${tournament.title}</h2>
            <div class="stages-container" style="margin-top: 20px;"></div>
            <button class="btn add-stage-btn" style="background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Add New Stage</button>
            <button class="btn save-stages-btn" style="background: #2196F3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px; float: right;">Save Changes</button>
        `;
        
        modal.appendChild(modalContent);
    document.body.appendChild(modal);
        
        const stagesContainer = modal.querySelector('.stages-container');
        
        // Add existing stages if any
        if (tournament.stages && tournament.stages.length > 0) {
            tournament.stages.forEach((stage, index) => {
                const stageElement = createStageElement(stage, index);
                stagesContainer.appendChild(stageElement);
            });
        } else {
            // Add a default empty stage if none exists
            const emptyStage = createStageElement(null, 0);
            stagesContainer.appendChild(emptyStage);
        }

    // Add event listeners
    modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('.add-stage-btn').addEventListener('click', () => {
            const newStage = createStageElement(null, stagesContainer.children.length);
            stagesContainer.appendChild(newStage);
        });
        
        modal.querySelector('.save-stages-btn').addEventListener('click', () => saveStages(modal, tournamentId));
    })
    .catch(error => {
        console.error("Error loading tournament for stages:", error);
        showNotification("Failed to load tournament details for stages", "error");
    });
    
    // Helper function to create a stage element
    function createStageElement(stage, index) {
        const stageItem = document.createElement('div');
        stageItem.className = 'stage-item';
        stageItem.style.background = 'rgba(255, 255, 255, 0.1)';
        stageItem.style.padding = '20px';
        stageItem.style.borderRadius = '10px';
        stageItem.style.margin = '10px 0';
        stageItem.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        
        stageItem.innerHTML = `
            <h3 style="color: #ff4500; margin-bottom: 15px;">Stage ${index + 1}</h3>
            <div class="stage-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 15px;">
                <input type="text" class="stage-name" value="${stage ? (stage.name || '') : ''}" placeholder="Stage Name" style="padding: 10px; border-radius: 5px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2);">
                <input type="datetime-local" class="stage-date" value="${stage && stage.date ? new Date(stage.date).toISOString().slice(0, 16) : ''}" style="padding: 10px; border-radius: 5px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2);">
                <select class="stage-status" style="padding: 10px; border-radius: 5px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2);">
                    <option value="upcoming" ${stage && stage.status === 'upcoming' ? 'selected' : ''}>Upcoming</option>
                    <option value="ongoing" ${stage && stage.status === 'ongoing' ? 'selected' : ''}>Ongoing</option>
                    <option value="completed" ${stage && stage.status === 'completed' ? 'selected' : ''}>Completed</option>
            </select>
        </div>
            <button class="btn auto-assign-btn" style="background: #2196F3; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px; margin-right: 10px;">Auto-Assign Teams to Groups</button>
            <div class="groups-container" style="margin-top: 20px; padding: 15px; background: rgba(0, 0, 0, 0.2); border-radius: 8px;"></div>
            <button class="btn add-group-btn" style="background: #4CAF50; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">Add Group</button>
            <button class="btn remove-stage-btn" style="background: #f44336; color: white; padding: 8px 15px; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px; float: right;">Remove Stage</button>
        `;
        
    const groupsContainer = stageItem.querySelector('.groups-container');
        
        // Add existing groups if any
        if (stage && stage.groups && stage.groups.length > 0) {
            stage.groups.forEach((group, groupIndex) => {
                const groupElement = createGroupElement(group, groupIndex);
                groupsContainer.appendChild(groupElement);
            });
        }
        
        // Add event listeners
        stageItem.querySelector('.add-group-btn').addEventListener('click', () => {
    const groupCount = groupsContainer.querySelectorAll('.group-item').length;
            const newGroup = createGroupElement(null, groupCount);
            groupsContainer.appendChild(newGroup);
        });
        
        stageItem.querySelector('.remove-stage-btn').addEventListener('click', () => {
            const stagesCount = stageItem.parentElement.querySelectorAll('.stage-item').length;
            if (stagesCount > 1) {
                stageItem.remove();
            } else {
                showNotification('Cannot remove the last stage', 'error');
            }
        });
        
        stageItem.querySelector('.auto-assign-btn').addEventListener('click', async () => {
            autoAssignTeamsToGroups(tournamentId, stageItem);
        });
        
        return stageItem;
    }
    
    // Helper function to create a group element
    function createGroupElement(group, groupIndex) {
        const groupItem = document.createElement('div');
        groupItem.className = 'group-item';
        groupItem.style.background = 'rgba(255, 255, 255, 0.1)';
        groupItem.style.padding = '15px';
        groupItem.style.borderRadius = '8px';
        groupItem.style.margin = '10px 0';
        groupItem.style.border = '1px solid rgba(255, 255, 255, 0.1)';
        
        groupItem.innerHTML = `
            <h4 style="color: #ff4500; margin-bottom: 10px;">Group ${groupIndex + 1}</h4>
            <div class="group-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <input type="text" class="group-room-id" value="${group ? (group.roomId || '') : ''}" placeholder="Room ID" style="padding: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2);">
                <input type="text" class="group-room-password" value="${group ? (group.roomPassword || '') : ''}" placeholder="Room Password" style="padding: 8px; border-radius: 4px; background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2);">
            </div>
            <div class="group-teams" style="margin-top: 10px; padding: 10px; background: rgba(0, 0, 0, 0.2); border-radius: 5px;">
                <h5 style="color: #ff4500; margin-bottom: 5px;">Assigned Teams (${group && group.teams ? group.teams.length : 0}/18)</h5>
                <div class="team-tags">
                    ${group && group.teams ? group.teams.map(team => `
                        <span class="team-tag" style="display: inline-block; background: rgba(255, 69, 0, 0.2); color: #ff4500; padding: 3px 8px; border-radius: 12px; margin: 3px; font-size: 0.9rem;">${team.teamName}</span>
                    `).join('') : ''}
        </div>
            </div>
            <button class="btn remove-group-btn" style="background: #f44336; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; float: right;">Remove Group</button>
        `;
        
        // Add event listener for remove button
        groupItem.querySelector('.remove-group-btn').addEventListener('click', () => {
            const groupsCount = groupItem.parentElement.querySelectorAll('.group-item').length;
            if (groupsCount > 0) {
                groupItem.remove();
            }
        });
        
        return groupItem;
    }
}

async function autoAssignTeamsToGroups(tournamentId, stageItem) {
    try {
        // Display loading notification
        showNotification('Fetching teams for auto-assignment...', 'success');
        
        // Get the admin token
        const token = localStorage.getItem("token");
        if (!token) {
            throw new Error('Admin token not found. Please log in again.');
        }
        
        // Fetch teams for this tournament
        const response = await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/registrations`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch teams: ${response.status}`);
        }
        
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch teams');
        }
        
        const teams = data.teams || [];
        
        if (teams.length === 0) {
            showNotification('No teams found for this tournament', 'error');
            return;
        }
        
        showNotification(`Found ${teams.length} teams for assignment`, 'success');
        
        // Check for existing groups and create if needed
        const groupsContainer = stageItem.querySelector('.groups-container');
        let groups = groupsContainer.querySelectorAll('.group-item');
        
        // Clear existing teams from all groups first
        groups.forEach(group => {
            const teamTags = group.querySelector('.team-tags');
            if (teamTags) {
                teamTags.innerHTML = '';
            }
        });
        
        // Calculate how many groups we need (each group with 18 teams)
        const teamsPerGroup = 18;
        const requiredGroups = Math.ceil(teams.length / teamsPerGroup);
        
        // Create groups if we don't have enough
        if (groups.length < requiredGroups) {
            for (let i = groups.length; i < requiredGroups; i++) {
                const newGroup = createGroupElement(null, i);
                groupsContainer.appendChild(newGroup);
            }
            groups = groupsContainer.querySelectorAll('.group-item');
        }
        
        // Shuffle teams randomly
        const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);
        
        // Assign teams to groups
        shuffledTeams.forEach((team, index) => {
            const groupIndex = Math.floor(index / teamsPerGroup);
            if (groupIndex < groups.length) {
                const group = groups[groupIndex];
                const teamTags = group.querySelector('.team-tags');
                
                // Create team tag
                const teamTag = document.createElement('span');
                teamTag.className = 'team-tag';
                teamTag.style.display = 'inline-block';
                teamTag.style.background = 'rgba(255, 69, 0, 0.2)';
                teamTag.style.color = '#ff4500';
                teamTag.style.padding = '3px 8px';
                teamTag.style.borderRadius = '12px';
                teamTag.style.margin = '3px';
                teamTag.style.fontSize = '0.9rem';
                teamTag.textContent = team.name;
                teamTag.dataset.teamId = team.id || team._id;
                
                teamTags.appendChild(teamTag);
                
                // Update team count in heading
                const teamCountHeading = group.querySelector('h5');
                if (teamCountHeading) {
                    const teamsInGroup = teamTags.querySelectorAll('.team-tag').length;
                    teamCountHeading.textContent = `Assigned Teams (${teamsInGroup}/18)`;
                }
            }
        });
        
        showNotification(`Successfully assigned ${teams.length} teams to ${requiredGroups} groups`, 'success');
    } catch (error) {
        console.error('Error auto-assigning teams:', error);
        showNotification(`Error: ${error.message}`, 'error');
    }
}

async function saveStages(modal, tournamentId) {
    try {
        const stages = Array.from(modal.querySelectorAll('.stage-item')).map(item => {
            const stageName = item.querySelector('.stage-name').value;
            const stageDate = item.querySelector('.stage-date').value;
            const stageStatus = item.querySelector('.stage-status').value;
            
            if (!stageName) {
                throw new Error('Stage name cannot be empty');
            }
            
            if (!stageDate) {
                throw new Error('Stage date cannot be empty');
            }
            
            return {
                name: stageName,
                date: new Date(stageDate),
                status: stageStatus,
                groups: Array.from(item.querySelectorAll('.group-item')).map((group, index) => {
                    const roomId = group.querySelector('.group-room-id').value;
                    const roomPassword = group.querySelector('.group-room-password').value;
                    
                    // Collect team assignments from team tags
                    const teamTags = group.querySelectorAll('.team-tag');
                    const teams = Array.from(teamTags).map(tag => {
                        return {
                            teamId: tag.dataset.teamId,
                            teamName: tag.textContent
                        };
                    });
                    
                    return {
                        groupNumber: index + 1,
                        roomId: roomId,
                        roomPassword: roomPassword,
                        teams: teams
                    };
                })
            };
        });

        // Get the admin token
        const token = localStorage.getItem("token");
        console.log("Using token for saving stages:", token ? "Token exists" : "No token found");

        const response = await fetch(`http://localhost:3000/api/tournaments/${tournamentId}/stages`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ stages })
        });

        console.log("Save stages response status:", response.status);
        const data = await response.json();
        if (data.success) {
            showNotification('Tournament stages updated successfully', 'success');
            modal.remove();
            // Refresh the dashboard
            if (typeof loadAdminDashboard === 'function') {
                loadAdminDashboard();
            }
        } else {
            showNotification(data.message || 'Failed to update stages', 'error');
        }
    } catch (error) {
        console.error('Error saving stages:', error);
        showNotification(error.message || 'Failed to save tournament stages', 'error');
    }
}

function createTournament(event) {
    event.preventDefault();
    
    // Get the admin token
    const token = localStorage.getItem("token");
    if (!token) {
        showNotification("You must be logged in to create a tournament", "error");
        return;
    }
    
    const form = document.getElementById('create-tournament-form');
    const title = form.querySelector('#title').value;
    const description = form.querySelector('#description').value;
    const startDate = form.querySelector('#startDate').value;
    const endDate = form.querySelector('#endDate').value;
    const maxTeams = parseInt(form.querySelector('#maxTeams').value);
    const entryFee = parseFloat(form.querySelector('#entryFee').value);
    const prizePool = parseFloat(form.querySelector('#prizePool').value);
    const rules = form.querySelector('#rules').value;
    const tournamentPoster = form.querySelector('#tournamentPoster').value;
    const roadmapPoster = form.querySelector('#roadmapPoster').value;
    const prizePoolPoster = form.querySelector('#prizePoolPoster').value;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
        showNotification("End date must be after start date", "error");
        return;
    }
    
    const tournamentData = {
        title,
        description,
        startDate,
        endDate,
        maxTeams,
        entryFee,
        prizePool,
        rules,
        tournamentPoster,
        roadmapPoster,
        prizePoolPoster
    };

    console.log("Creating tournament with data:", tournamentData);

    fetch('http://localhost:3000/api/admin/create-tournament', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(tournamentData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Tournament created successfully:", data);
        showNotification("Tournament created successfully!", "success");
        showManageEvents();
    })
    .catch(error => {
        console.error("Error creating tournament:", error);
        showNotification("Error creating tournament. Please try again.", "error");
    });
}

function editTournament(id) {
    // Get the admin token
    const token = localStorage.getItem("token");
    console.log("Using token for editing tournament:", token ? "Token exists" : "No token found");
    
    // Fetch tournament details first
    fetch(`http://localhost:3000/api/tournaments/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log("Tournament fetch response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(tournament => {
            console.log("Tournament data for editing:", tournament);
            
            // Format dates for datetime-local input
            const formatDateForInput = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toISOString().slice(0, 16); // Format as "YYYY-MM-DDThh:mm"
            };
            
            const adminContent = document.getElementById('admin-content');
            adminContent.innerHTML = `
                <div class="create-event-form">
                    <h3>Edit Tournament</h3>
                    <form id="edit-tournament-form" onsubmit="updateTournament(event, '${id}')">
                        <input type="text" id="title" value="${tournament.title || ''}" placeholder="Tournament Title" required>
                        <textarea id="description" placeholder="Tournament Description" required>${tournament.description || ''}</textarea>
                        
                        <div class="form-group">
                            <label for="tournamentPoster">Tournament Poster (Image URL or upload)</label>
                            <input type="text" id="tournamentPoster" value="${tournament.tournamentPoster || ''}" placeholder="Tournament Poster URL">
                            <input type="file" id="tournamentPosterUpload" accept="image/*">
                            ${tournament.tournamentPoster ? `<div class="poster-preview"><img src="${tournament.tournamentPoster}" alt="Tournament Poster" style="max-width: 200px;"></div>` : ''}
                        </div>
                        
                        <div class="form-group">
                            <label for="roadmapPoster">Roadmap Poster (Image URL or upload)</label>
                            <input type="text" id="roadmapPoster" value="${tournament.roadmapPoster || ''}" placeholder="Roadmap Poster URL">
                            <input type="file" id="roadmapPosterUpload" accept="image/*">
                            ${tournament.roadmapPoster ? `<div class="poster-preview"><img src="${tournament.roadmapPoster}" alt="Roadmap Poster" style="max-width: 200px;"></div>` : ''}
                        </div>
                        
                        <div class="form-group">
                            <label for="prizePoolPoster">Prize Pool Distribution Poster (Image URL or upload)</label>
                            <input type="text" id="prizePoolPoster" value="${tournament.prizePoolPoster || ''}" placeholder="Prize Pool Poster URL">
                            <input type="file" id="prizePoolPosterUpload" accept="image/*">
                            ${tournament.prizePoolPoster ? `<div class="poster-preview"><img src="${tournament.prizePoolPoster}" alt="Prize Pool Poster" style="max-width: 200px;"></div>` : ''}
                        </div>
                        
                        <input type="datetime-local" id="startDate" value="${formatDateForInput(tournament.startDate)}" required>
                        <input type="datetime-local" id="endDate" value="${formatDateForInput(tournament.endDate)}" required>
                        <input type="number" id="maxTeams" value="${tournament.maxTeams || ''}" placeholder="Maximum Teams" required>
                        <input type="number" id="entryFee" value="${tournament.entryFee || 0}" placeholder="Entry Fee" required>
                        <input type="number" id="prizePool" value="${tournament.prizePool || ''}" placeholder="Prize Pool" required>
                        <textarea id="rules" placeholder="Tournament Rules" required>${tournament.rules || ''}</textarea>
                        <div class="form-buttons">
                            <button type="button" class="btn back-btn" onclick="showManageEvents()">Cancel</button>
                            <button type="submit" class="btn">Save Changes</button>
                        </div>
                    </form>
                </div>`;
                
            // Set up file upload handlers
            document.getElementById('tournamentPosterUpload').addEventListener('change', handleFileUpload);
            document.getElementById('roadmapPosterUpload').addEventListener('change', handleFileUpload);
            document.getElementById('prizePoolPosterUpload').addEventListener('change', handleFileUpload);
        })
        .catch(error => {
            console.error("Error fetching tournament details:", error);
            showNotification("Error loading tournament details. Please try again.", "error");
        });
}

// Function to handle file uploads and convert to data URLs
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    const fieldId = event.target.id.replace('Upload', '');
    
    reader.onload = function(e) {
        document.getElementById(fieldId).value = e.target.result;
        
        // Update preview if it exists
        const previewContainer = event.target.parentElement.querySelector('.poster-preview');
        if (previewContainer) {
            previewContainer.innerHTML = `<img src="${e.target.result}" alt="Poster Preview" style="max-width: 200px;">`;
        } else {
            const newPreview = document.createElement('div');
            newPreview.className = 'poster-preview';
            newPreview.innerHTML = `<img src="${e.target.result}" alt="Poster Preview" style="max-width: 200px;">`;
            event.target.parentElement.appendChild(newPreview);
        }
    };
    
    reader.readAsDataURL(file);
}

function updateTournament(event, id) {
    event.preventDefault();
    
    // Get the admin token
    const token = localStorage.getItem("token");
    if (!token) {
        showNotification("You must be logged in to update a tournament", "error");
        return;
    }
    
    const form = document.getElementById('edit-tournament-form');
    const title = form.querySelector('#title').value;
    const description = form.querySelector('#description').value;
    const startDate = form.querySelector('#startDate').value;
    const endDate = form.querySelector('#endDate').value;
    const maxTeams = parseInt(form.querySelector('#maxTeams').value);
    const entryFee = parseFloat(form.querySelector('#entryFee').value);
    const prizePool = parseFloat(form.querySelector('#prizePool').value);
    const rules = form.querySelector('#rules').value;
    const tournamentPoster = form.querySelector('#tournamentPoster').value;
    const roadmapPoster = form.querySelector('#roadmapPoster').value;
    const prizePoolPoster = form.querySelector('#prizePoolPoster').value;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
        showNotification("End date must be after start date", "error");
        return;
    }

    const updatedTournament = {
        title,
        description,
        startDate,
        endDate,
        maxTeams,
        entryFee,
        prizePool,
        rules,
        tournamentPoster,
        roadmapPoster,
        prizePoolPoster
    };

    console.log("Updating tournament with data:", updatedTournament);

    fetch(`http://localhost:3000/api/admin/update-tournament/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedTournament)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log("Tournament updated successfully:", data);
        showNotification("Tournament updated successfully!", "success");
        showManageEvents();
    })
    .catch(error => {
        console.error("Error updating tournament:", error);
        showNotification("Error updating tournament. Please try again.", "error");
    });
}

function deleteTournament(id) {
    if (confirm("Are you sure you want to delete this tournament?")) {
        fetch(`http://localhost:3000/api/admin/delete-tournament/${id}`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Tournament deleted successfully!");
                showManageEvents(); // Refresh the tournament list
            } else {
                alert("Error deleting tournament: " + data.message);
            }
        })
        .catch(error => {
            console.error("Error deleting tournament:", error);
            alert("Error deleting tournament. Please try again.");
        });
    }
}

function viewRegistrations(tournamentId) {
    const modal = document.getElementById('tournament-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Show loading state
    modalContent.innerHTML = '<div class="loading-spinner">Loading registrations...</div>';
    modal.style.display = 'block';
    
    // Get admin token
    const token = localStorage.getItem("token");
    if (!token) {
        showNotification("Please log in as admin to view registrations.", "error");
        return;
    }
    
    // Fetch registrations
    fetch(`http://localhost:3000/api/tournaments/${tournamentId}/registrations`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            throw new Error(data.message || "Failed to fetch registrations");
        }
        
        const teams = data.teams;
        if (teams.length === 0) {
            modalContent.innerHTML = `
                <div class="registrations-list">
                    <h2>Team Registrations</h2>
                    <p>No teams registered yet.</p>
                    <button class="btn" onclick="closeModal()">Close</button>
                        </div>`;
            return;
        }
        
        // Create table for registrations
        modalContent.innerHTML = `
            <div class="registrations-list">
                <h2>Team Registrations</h2>
                <div class="table-container">
                    <table class="registrations-table">
                        <thead>
                            <tr>
                                <th>Team Name</th>
                                <th>Leader</th>
                                <th>Contact</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teams.map(team => `
                                <tr>
                                    <td>${team.name}</td>
                                    <td>${team.leader}</td>
                                    <td>${team.contact}</td>
                                    <td>${team.email}</td>
                                    <td>
                                        <button class="btn delete-btn" onclick="removeTeam('${tournamentId}', '${team.id}')">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="modal-actions">
                    <button class="btn" onclick="downloadTournamentRegistrations('${tournamentId}')">
                        Download Registrations
                    </button>
                    <button class="btn" onclick="closeModal()">Close</button>
                    </div>
                </div>`;
        })
        .catch(error => {
        console.error("Error fetching registrations:", error);
        modalContent.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Registrations</h3>
                <p>${error.message}</p>
                <button class="btn" onclick="closeModal()">Close</button>
                </div>`;
        });
}

function downloadTournamentRegistrations(tournamentId) {
    console.log('Starting download for tournament:', tournamentId);
    
    // Get the admin token
    const token = localStorage.getItem("token");
    console.log("Using token for downloading registrations:", token ? "Token exists" : "No token found");
    
    fetch(`http://localhost:3000/api/tournaments/${tournamentId}/registrations`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log('Registration response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Registration data received:', data);
            // Get tournament details first
            return fetch(`http://localhost:3000/api/tournaments/${tournamentId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(response => {
                    console.log('Tournament response status:', response.status);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(tournament => {
                    console.log('Tournament data received:', tournament);
                    return { tournament, registrations: data.teams || [] };
                });
        })
        .then(({ tournament, registrations }) => {
            console.log('Processing data for CSV:', { tournament, registrations });
            
            // Create CSV content
            let csvContent = `Tournament: ${tournament.title}\n`;
            csvContent += `Description: ${tournament.description}\n`;
            csvContent += `Start Date: ${new Date(tournament.startDate).toLocaleString()}\n`;
            csvContent += `End Date: ${new Date(tournament.endDate).toLocaleString()}\n\n`;
            
            // Add headers
            csvContent += 'Team Name,Team Leader,Contact,Email,Gmail ID,Player 1 UID,Player 1 IGN,Player 2 UID,Player 2 IGN,Player 3 UID,Player 3 IGN,Player 4 UID,Player 4 IGN,Registration Date\n';
            
            // Add data rows
            if (Array.isArray(registrations)) {
                registrations.forEach(registration => {
                    console.log('Processing registration:', registration);
                    const row = [
                        registration.name || '',
                        registration.leader || '',
                        registration.contact || '',
                        registration.email || '',
                        registration.userEmail || 'Not Available', // Handle old registrations
                        registration.members[0]?.uid || '',
                        registration.members[0]?.ign || '',
                        registration.members[1]?.uid || '',
                        registration.members[1]?.ign || '',
                        registration.members[2]?.uid || '',
                        registration.members[2]?.ign || '',
                        registration.members[3]?.uid || '',
                        registration.members[3]?.ign || '',
                        new Date(registration.registeredAt).toLocaleString()
                    ].map(field => `"${field}"`).join(',');
                    
                    csvContent += row + '\n';
                });
            } else {
                console.error('Invalid registration data:', registrations);
                throw new Error('Invalid registration data format');
            }
            
            console.log('CSV content generated, creating download...');
            
            // Create and trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `${tournament.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log('Download triggered successfully');
        })
        .catch(error => {
            console.error('Detailed error in downloadTournamentRegistrations:', error);
            showNotification(`Failed to download registrations: ${error.message}`, 'error');
        });
}

function downloadAllRegistrations() {
    // Get the admin token
    const token = localStorage.getItem("token");
    console.log("Using token for downloading all registrations:", token ? "Token exists" : "No token found");

    fetch("http://localhost:3000/api/tournaments", {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            console.log('All tournaments response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(tournaments => {
            // Create a zip file containing all tournament registrations
            const zip = new zip();
            
            // Download registrations for each tournament
            const downloadPromises = tournaments.map(tournament => 
                fetch(`http://localhost:3000/api/tournaments/${tournament._id}/registrations`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(registrations => {
                        // Create CSV content for this tournament
                        let csvContent = `Tournament: ${tournament.title}\n`;
                        csvContent += `Description: ${tournament.description}\n`;
                        csvContent += `Start Date: ${new Date(tournament.startDate).toLocaleString()}\n`;
                        csvContent += `End Date: ${new Date(tournament.endDate).toLocaleString()}\n\n`;
                        
                        csvContent += 'Team Name,Team Leader,Contact,Email,Player 1,Player 2,Player 3,Player 4,Registration Date\n';
                        
                        registrations.forEach(registration => {
                            const row = [
                                registration.name || '',
                                registration.leader || '',
                                registration.contact || '',
                                registration.email || '',
                                registration.members[0]?.ign || '',
                                registration.members[1]?.ign || '',
                                registration.members[2]?.ign || '',
                                registration.members[3]?.ign || '',
                                new Date(registration.registeredAt).toLocaleString()
                            ].map(field => `"${field}"`).join(',');
                            
                            csvContent += row + '\n';
                        });
                        
                        // Add to zip file
                        zip.file(`${tournament.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations.csv`, csvContent);
                    })
            );
            
            // When all downloads are complete, generate the zip file
            Promise.all(downloadPromises)
                .then(() => {
                    zip.generateAsync({type: "blob"})
                        .then(content => {
                            // Create and trigger download
                            const link = document.createElement('a');
                            const url = URL.createObjectURL(content);
                            
                            link.setAttribute('href', url);
                            link.setAttribute('download', 'all_tournament_registrations.zip');
                            link.style.visibility = 'hidden';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        });
                });
        })
        .catch(error => {
            console.error('Error downloading all registrations:', error);
            showNotification('Failed to download all registrations. Please try again.', 'error');
        });
}

function removeTeam(tournamentId, teamId) {
    if (confirm("Are you sure you want to remove this team from the tournament?")) {
        // Get the admin token
        const token = localStorage.getItem("token");
        console.log("Using token for removing team:", token ? "Token exists" : "No token found");

        fetch(`http://localhost:3000/api/admin/tournaments/${tournamentId}/teams/${teamId}`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => {
            console.log("Remove team response status:", response.status);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showNotification("Team removed successfully!", "success");
                // Refresh the registrations list
                viewRegistrations(tournamentId);
            } else {
                showNotification("Error removing team: " + data.message, "error");
            }
        })
        .catch(error => {
            console.error("Team Removal Error:", error);
            showNotification("Server error, please try again.", "error");
        });
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Add styles if not already present
    if (!document.querySelector('style#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 5px;
                color: white;
                font-weight: bold;
                z-index: 1000;
                animation: slideIn 0.3s ease-out;
            }

            .notification.success {
                background-color: #4CAF50;
            }

            .notification.error {
                background-color: #f44336;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        
        // Add slideOut animation if not already present
        if (!document.querySelector('style#notification-styles-out')) {
            const style = document.createElement('style');
            style.id = 'notification-styles-out';
            style.textContent = `
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
