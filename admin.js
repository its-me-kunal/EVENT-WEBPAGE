document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("loggedIn") === "true" && localStorage.getItem("role") === "admin") {
        showAdminDashboard();
        loadTournaments();
        
        // Show logout button
        const logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.style.display = "block";
        }
    }
});

function adminLogin() {
    const username = document.getElementById("admin-username").value.trim();
    const password = document.getElementById("admin-password").value.trim();
    const loginError = document.getElementById("login-error");

    console.log("Login attempt with username:", username);

    if (!username || !password) {
        loginError.textContent = "Username and Password cannot be empty!";
        return;
    }

    console.log("Sending login request to server...");
    
    // Use API base URL from config
    fetch(`${window.PRConfig.API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        console.log("Login response status:", response.status);
        if (!response.ok && response.status === 404) {
            // If the endpoint doesn't exist, try the alternative endpoint
            console.log("Primary endpoint failed, trying alternative endpoint");
            return tryAlternativeLogin(username, password);
        }
        return response.json();
    })
    .then(data => {
        if (!data) return; // This happens if we switched to alternative endpoint
        
        console.log("Login response data:", data);
        if (data.success && data.role === "admin") {
            console.log("Admin login successful");
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("role", "admin");
            if (data.token) {
                console.log("Storing token:", data.token);
                localStorage.setItem("adminToken", data.token);
            } else {
                console.warn("No token received from server");
                localStorage.setItem("adminToken", "");
            }
            showAdminDashboard();
            loadTournaments();
        } else {
            console.error("Login failed:", data.message || "Unknown error");
            loginError.textContent = "Invalid admin credentials!";
        }
    })
    .catch(error => {
        console.error("Login Error:", error);
        loginError.textContent = "Server error, please try again.";
    });
    
    // Function to try the alternative login endpoint
    function tryAlternativeLogin(username, password) {
        return fetch(`${window.PRConfig.API_BASE_URL}/api/auth/admin`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        })
        .then(response => {
            console.log("Alternative login response status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("Alternative login response data:", data);
            if (data.success && data.role === "admin") {
                console.log("Admin login successful via alternative endpoint");
                localStorage.setItem("loggedIn", "true");
                localStorage.setItem("role", "admin");
                if (data.token) {
                    console.log("Storing token:", data.token);
                    localStorage.setItem("adminToken", data.token);
                } else {
                    console.warn("No token received from server");
                    localStorage.setItem("adminToken", "");
                }
                showAdminDashboard();
                loadTournaments();
                return null; // Signal that we've handled this response
            } else {
                console.error("Alternative login failed:", data.message || "Unknown error");
                loginError.textContent = "Invalid admin credentials!";
                return data;
            }
        });
    }
}

function showAdminDashboard() {
    const adminContent = document.getElementById("admin-dashboard");
    if (!adminContent) {
        console.error("Admin dashboard element not found!");
        return;
    }

    // Hide login container
    document.getElementById("login-container").style.display = "none";
    // Show main content
    document.getElementById("main-content").style.display = "block";
    // Show admin dashboard
    adminContent.style.display = "block";
    // Show logout button
    document.getElementById("logout-btn").style.display = "block";

    // Create admin dashboard content if not already present
    let mainContent = adminContent.querySelector(".admin-main-content");
    if (!mainContent) {
        mainContent = document.createElement('div');
        mainContent.className = 'admin-main-content';
        mainContent.innerHTML = `
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
            <div id="tournament-list">
                <!-- Tournaments will be loaded here -->
            </div>
        `;
        adminContent.appendChild(mainContent);
    }

    // Load admin statistics
    fetchAdminStats();
    
    // Load tournaments immediately
    loadTournaments();
}

function fetchAdminStats() {
    const totalTournamentsEl = document.getElementById('total-tournaments');
    const activeTournamentsEl = document.getElementById('active-tournaments');
    const totalRegistrationsEl = document.getElementById('total-registrations');

    if (!totalTournamentsEl || !activeTournamentsEl || !totalRegistrationsEl) {
        console.error("Admin statistics elements not found!");
        return;
    }

    // Show loading state
    totalTournamentsEl.textContent = 'Loading...';
    activeTournamentsEl.textContent = 'Loading...';
    totalRegistrationsEl.textContent = 'Loading...';

    // Get the admin token
    const token = localStorage.getItem("adminToken");
    console.log("Using token for stats:", token ? "Token exists" : "No token found");

    fetch(`${window.PRConfig.API_BASE_URL}/api/admin/stats`, {
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

function createTournament() {
    // Collect basic tournament info
    const tournamentData = {
        title: document.getElementById("tournament-title").value.trim(),
        description: document.getElementById("tournament-description").value.trim(),
        startDate: document.getElementById("tournament-date").value,
        endDate: document.getElementById("tournament-end-date").value,
        entryFee: document.getElementById("entry-fee").value,
        maxTeams: document.getElementById("total-teams").value,
        teamSize: document.getElementById("team-size").value,
        prizePool: document.getElementById("prize-pool").value,
        rules: document.getElementById("tournament-rules").value.trim(),
        contactInfo: document.getElementById("contact-info").value.trim(),
        streamLink: document.getElementById("stream-link").value.trim(),
        role: localStorage.getItem("role")
    };

    // Collect roadmap data
    const roadmapStages = [];
    document.querySelectorAll('.roadmap-stage').forEach(stage => {
        roadmapStages.push({
            name: stage.querySelector('.stage-name').value.trim(),
            date: stage.querySelector('.stage-date').value,
            maps: stage.querySelector('.stage-maps').value.trim()
        });
    });
    tournamentData.roadmap = roadmapStages;

    // Handle the banner image
    const bannerFile = document.getElementById("tournament-banner").files[0];
    if (bannerFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            tournamentData.image = e.target.result;
            submitTournamentData(tournamentData);
        };
        reader.readAsDataURL(bannerFile);
    } else {
        submitTournamentData(tournamentData);
    }
}

function submitTournamentData(tournamentData) {
    // Basic validation
    if (!tournamentData.title) {
        alert("Tournament name cannot be empty!");
        return;
    }

    console.log("Submitting tournament data:", tournamentData);
    
    // Get the admin token
    const token = localStorage.getItem("adminToken");
    console.log("Using admin token:", token ? "Token exists" : "No token found");

    fetch(`${window.PRConfig.API_BASE_URL}/api/admin/create-tournament`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(tournamentData)
    })
    .then(response => {
        console.log("Server response status:", response.status);
        return response.json();
    })
    .then(data => {
        console.log("Server response data:", data);
        if (data.success) {
            alert("Tournament created successfully!");
            clearTournamentForm();
            loadTournaments();
        } else {
            const errorMessage = data.message || "Unknown error occurred";
            console.error("Tournament creation failed:", errorMessage);
            alert("Error creating tournament: " + errorMessage);
        }
    })
    .catch(error => {
        console.error("Tournament Creation Error:", error);
        alert("Server error, please try again. Details: " + error.message);
    });
}

function clearTournamentForm() {
    document.getElementById("tournament-title").value = "";
    document.getElementById("tournament-description").value = "";
    document.getElementById("tournament-date").value = "";
    document.getElementById("tournament-end-date").value = "";
    document.getElementById("entry-fee").value = "";
    document.getElementById("total-teams").value = "";
    document.getElementById("team-size").value = "";
    document.getElementById("prize-pool").value = "";
    document.getElementById("tournament-rules").value = "";
    document.getElementById("contact-info").value = "";
    document.getElementById("stream-link").value = "";
    document.getElementById("tournament-banner").value = "";
    document.getElementById("banner-preview").style.display = "none";
    
    // Reset roadmap stages except for the first one
    const stages = document.querySelectorAll('.roadmap-stage');
    for (let i = 1; i < stages.length; i++) {
        stages[i].remove();
    }
    const firstStage = document.querySelector('.roadmap-stage');
    if (firstStage) {
        firstStage.querySelector('.stage-name').value = "";
        firstStage.querySelector('.stage-date').value = "";
        firstStage.querySelector('.stage-maps').value = "";
    }
}

function loadTournaments() {
    fetch(`${window.PRConfig.API_BASE_URL}/api/tournaments`)
        .then(response => response.json())
        .then(tournaments => {
            const tournamentList = document.getElementById("tournament-list");
            if (!tournamentList) {
                console.error("Tournament list element not found!");
                return;
            }
            
            tournamentList.innerHTML = ""; // Clear previous events
            
            if (!tournaments || tournaments.length === 0) {
                tournamentList.innerHTML = "<p>No tournaments available.</p>";
                return;
            }
            
            // Add download all button at the top
            const downloadAllButton = document.createElement('button');
            downloadAllButton.className = 'btn download-all-btn';
            downloadAllButton.innerHTML = '<i class="fas fa-download"></i> Download All Registrations';
            downloadAllButton.onclick = downloadRegistrations;
            tournamentList.appendChild(downloadAllButton);
            
            tournaments.forEach(tournament => {
                const tournamentCard = document.createElement('div');
                tournamentCard.className = 'event-card';
                tournamentCard.innerHTML = `
                    <h3>${tournament.title}</h3>
                    <p>${tournament.description ? tournament.description.substring(0, 100) + (tournament.description.length > 100 ? '...' : '') : 'No description'}</p>
                    <p><strong>Date:</strong> ${formatDate(tournament.startDate)}</p>
                    <p><strong>Teams:</strong> ${tournament.registeredTeams || 0}/${tournament.maxTeams}</p>
                    <div class="card-actions">
                        <button class="btn" onclick="editTournament('${tournament.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn" onclick="viewRegistrations('${tournament.id}')">
                            <i class="fas fa-users"></i> View Teams
                        </button>
                        <button class="btn" onclick="downloadTournamentRegistrations('${tournament.id}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                        <button class="btn" onclick="deleteTournament('${tournament.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                tournamentList.appendChild(tournamentCard);
            });
        })
        .catch(error => {
            console.error("Error loading tournaments:", error);
            const tournamentList = document.getElementById("tournament-list");
            if (tournamentList) {
                tournamentList.innerHTML = "<p>Error loading tournaments. Please try again later.</p>";
            }
        });
}

function editTournament(tournamentId) {
    fetch(`${window.PRConfig.API_BASE_URL}/api/tournaments/${tournamentId}`)
        .then(response => response.json())
        .then(tournament => {
            if (tournament) {
                fillTournamentForm(tournament);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        })
        .catch(error => console.error("Error loading tournament details:", error));
}

function fillTournamentForm(tournament) {
    document.getElementById("tournament-title").value = tournament.title || "";
    document.getElementById("tournament-description").value = tournament.description || "";
    document.getElementById("tournament-date").value = tournament.startDate || "";
    document.getElementById("tournament-end-date").value = tournament.endDate || "";
    document.getElementById("entry-fee").value = tournament.entryFee || "";
    document.getElementById("total-teams").value = tournament.maxTeams || "";
    document.getElementById("team-size").value = tournament.teamSize || "";
    document.getElementById("prize-pool").value = tournament.prizePool || "";
    document.getElementById("tournament-rules").value = tournament.rules || "";
    document.getElementById("contact-info").value = tournament.contactInfo || "";
    document.getElementById("stream-link").value = tournament.streamLink || "";
    
    // Display banner if exists
    if (tournament.image) {
        const preview = document.getElementById('banner-preview');
        preview.src = tournament.image;
        preview.style.display = 'block';
    }
    
    // Load roadmap stages
    const container = document.getElementById('roadmap-container');
    container.innerHTML = ''; // Clear existing stages
    
    if (tournament.roadmap && tournament.roadmap.length > 0) {
        tournament.roadmap.forEach(stage => {
            const stageElement = document.createElement('div');
            stageElement.className = 'roadmap-stage';
            stageElement.innerHTML = `
                <button class="remove-stage">×</button>
                <div class="form-group">
                    <label>Stage Name:</label>
                    <input type="text" class="stage-name" value="${stage.name || ''}" placeholder="Qualifier Round">
                </div>
                <div class="form-group">
                    <label>Date & Time:</label>
                    <input type="datetime-local" class="stage-date" value="${stage.date || ''}">
                </div>
                <div class="form-group">
                    <label>Maps:</label>
                    <input type="text" class="stage-maps" value="${stage.maps || ''}" placeholder="Erangel, Miramar">
                </div>
            `;
            container.appendChild(stageElement);
            
            // Add event listener to the remove button
            stageElement.querySelector('.remove-stage').addEventListener('click', function() {
                if (document.querySelectorAll('.roadmap-stage').length > 1) {
                    container.removeChild(stageElement);
                }
            });
        });
    } else {
        // Add a default empty stage if none exists
        const defaultStage = document.createElement('div');
        defaultStage.className = 'roadmap-stage';
        defaultStage.innerHTML = `
            <button class="remove-stage">×</button>
            <div class="form-group">
                <label>Stage Name:</label>
                <input type="text" class="stage-name" placeholder="Qualifier Round">
            </div>
            <div class="form-group">
                <label>Date & Time:</label>
                <input type="datetime-local" class="stage-date">
            </div>
            <div class="form-group">
                <label>Maps:</label>
                <input type="text" class="stage-maps" placeholder="Erangel, Miramar">
            </div>
        `;
        container.appendChild(defaultStage);
        
        // Add event listener to the remove button
        defaultStage.querySelector('.remove-stage').addEventListener('click', function() {
            if (document.querySelectorAll('.roadmap-stage').length > 1) {
                container.removeChild(defaultStage);
            }
        });
    }
}

function viewRegistrations(tournamentId) {
    fetch(`${window.PRConfig.API_BASE_URL}/api/tournaments/${tournamentId}/registrations`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.teams.length > 0) {
                // Create and show a modal with the list of teams
                showTeamsModal(data.teams, tournamentId);
            } else {
                alert("No teams registered for this tournament yet.");
            }
        })
        .catch(error => console.error("Error loading registrations:", error));
}

function showTeamsModal(teams, tournamentId) {
    // Create modal container
    const modal = document.createElement('div');
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
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = '#222';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '10px';
    modalContent.style.width = '80%';
    modalContent.style.maxWidth = '800px';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflow = 'auto';
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = 'X';
    closeBtn.className = 'btn';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
    closeBtn.addEventListener('click', () => document.body.removeChild(modal));
    modalContent.appendChild(closeBtn);
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = 'Registered Teams';
    title.style.marginBottom = '20px';
    modalContent.appendChild(title);
    
    // Add teams list
    const teamsList = document.createElement('div');
    teams.forEach((team, index) => {
        const teamCard = document.createElement('div');
        teamCard.style.padding = '10px';
        teamCard.style.marginBottom = '10px';
        teamCard.style.backgroundColor = 'rgba(255, 69, 0, 0.2)';
        teamCard.style.borderRadius = '5px';
        
        teamCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>#${index + 1} ${team.name}</strong> 
                    <p>Leader: ${team.leader}</p>
                    <p>Contact: ${team.contact}</p>
                </div>
                <button class="btn" onclick="removeTeam(${tournamentId}, '${team.id}')">Remove</button>
            </div>
        `;
        teamsList.appendChild(teamCard);
    });
    modalContent.appendChild(teamsList);
    
    // Add modal to body
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

function deleteTournament(tournamentId) {
    if (confirm("Are you sure you want to delete this tournament? This action cannot be undone.")) {
        const token = localStorage.getItem("adminToken");
        console.log("Using token for deletion:", token);
        
        fetch(`${window.PRConfig.API_BASE_URL}/api/admin/delete-tournament/${tournamentId}`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })
        .then(response => {
            console.log("Delete response status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("Delete response data:", data);
            if (data.success) {
                alert("Tournament deleted successfully!");
                loadTournaments();
            } else {
                alert("Error deleting tournament: " + data.message);
            }
        })
        .catch(error => {
            console.error("Tournament Deletion Error:", error);
            alert("Server error, please try again.");
        });
    }
}

function removeTeam(tournamentId, teamId) {
    if (confirm("Are you sure you want to remove this team from the tournament?")) {
        fetch(`${window.PRConfig.API_BASE_URL}/api/admin/tournaments/${tournamentId}/teams/${teamId}`, {
            method: "DELETE",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("adminToken")}`
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Team removed successfully!");
                // Refresh the teams list
                viewRegistrations(tournamentId);
            } else {
                alert("Error removing team: " + data.message);
            }
        })
        .catch(error => {
            console.error("Team Removal Error:", error);
            alert("Server error, please try again.");
        });
    }
}

function logout() {
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("role");
    localStorage.removeItem("adminToken");
    window.location.reload();
}

function formatDate(dateString) {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function downloadRegistrations() {
    try {
        // Show loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-spinner';
        loadingDiv.textContent = 'Preparing export...';
        document.body.appendChild(loadingDiv);

        // Fetch all tournaments
        fetch(`${window.PRConfig.API_BASE_URL}/api/tournaments`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch tournaments');
                }
                return response.json();
            })
            .then(tournaments => {
                // Create a workbook for each tournament
                tournaments.forEach(tournament => {
                    const workbook = new ExcelJS.Workbook();
                    const worksheet = workbook.addWorksheet('Registrations');
                    
                    // Add headers
                    worksheet.columns = [
                        { header: 'Team Name', key: 'teamName', width: 20 },
                        { header: 'Team Captain', key: 'teamCaptain', width: 20 },
                        { header: 'Contact', key: 'contact', width: 15 },
                        { header: 'Email', key: 'email', width: 25 },
                        { header: 'Player 1 UID', key: 'player1UID', width: 15 },
                        { header: 'Player 1 IGN', key: 'player1IGN', width: 20 },
                        { header: 'Player 2 UID', key: 'player2UID', width: 15 },
                        { header: 'Player 2 IGN', key: 'player2IGN', width: 20 },
                        { header: 'Player 3 UID', key: 'player3UID', width: 15 },
                        { header: 'Player 3 IGN', key: 'player3IGN', width: 20 },
                        { header: 'Player 4 UID', key: 'player4UID', width: 15 },
                        { header: 'Player 4 IGN', key: 'player4IGN', width: 20 },
                        { header: 'Registration Date', key: 'registrationDate', width: 20 },
                        { header: 'Team Experience', key: 'teamExperience', width: 30 },
                        { header: 'Achievements', key: 'achievements', width: 30 },
                        { header: 'Social Media', key: 'socialMedia', width: 30 },
                        { header: 'Notes', key: 'notes', width: 40 }
                    ];

                    // Fetch registrations for this tournament
                    return fetch(`${window.PRConfig.API_BASE_URL}/api/tournaments/${tournament.id}/registrations`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to fetch registrations');
                            }
                            return response.json();
                        })
                        .then(data => {
                            // Add data rows
                            data.teams.forEach(team => {
                                worksheet.addRow({
                                    teamName: team.name || 'N/A',
                                    teamCaptain: team.leader || 'N/A',
                                    contact: team.contact || 'N/A',
                                    email: team.email || 'N/A',
                                    player1UID: team.members[0]?.uid || 'N/A',
                                    player1IGN: team.members[0]?.ign || 'N/A',
                                    player2UID: team.members[1]?.uid || 'N/A',
                                    player2IGN: team.members[1]?.ign || 'N/A',
                                    player3UID: team.members[2]?.uid || 'N/A',
                                    player3IGN: team.members[2]?.ign || 'N/A',
                                    player4UID: team.members[3]?.uid || 'N/A',
                                    player4IGN: team.members[3]?.ign || 'N/A',
                                    registrationDate: new Date(team.registeredAt).toLocaleString(),
                                    teamExperience: team.teamExperience || 'N/A',
                                    achievements: team.achievements || 'N/A',
                                    socialMedia: team.socialMedia || 'N/A',
                                    notes: team.notes || 'N/A'
                                });
                            });

                            // Style the worksheet
                            worksheet.getRow(1).font = { bold: true };
                            worksheet.getRow(1).fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FF4500' }
                            };
                            worksheet.getRow(1).font = { color: { argb: 'FFFFFF' } };

                            // Generate Excel file for this tournament
                            return workbook.xlsx.writeBuffer()
                                .then(buffer => {
                                    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    // Sanitize tournament title for filename
                                    const sanitizedTitle = tournament.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                                    a.download = `${sanitizedTitle}_registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
                                    document.body.appendChild(a);
                                    a.click();
                                    window.URL.revokeObjectURL(url);
                                    document.body.removeChild(a);
                                });
                        });
                });
            })
            .then(() => {
                // Remove loading state
                document.body.removeChild(loadingDiv);
                // Show success message
                showNotification('Exports completed successfully!', 'success');
            })
            .catch(error => {
                console.error('Export failed:', error);
                showNotification('Failed to export registrations. Please try again.', 'error');
                // Remove loading state
                const loadingDiv = document.querySelector('.loading-spinner');
                if (loadingDiv) {
                    document.body.removeChild(loadingDiv);
                }
            });
    } catch (error) {
        console.error('Export failed:', error);
        showNotification('Failed to export registrations. Please try again.', 'error');
        // Remove loading state
        const loadingDiv = document.querySelector('.loading-spinner');
        if (loadingDiv) {
            document.body.removeChild(loadingDiv);
        }
    }
}

// Function to show notifications
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to download registrations for a specific tournament
async function downloadTournamentRegistrations(tournamentId) {
    const downloadBtn = event.currentTarget;
    const originalBtnText = downloadBtn.innerHTML;
    
    try {
        // Disable button and show loading state
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';

        // Show loading overlay
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-spinner';
        loadingDiv.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <p>Preparing export...</p>
            <p>This may take a few moments...</p>
        `;
        document.body.appendChild(loadingDiv);

        // Fetch tournament details
        const tournamentResponse = await fetch(`${window.PRConfig.API_BASE_URL}/api/tournaments/${tournamentId}`);
        if (!tournamentResponse.ok) {
            throw new Error('Failed to fetch tournament details');
        }
        const tournament = await tournamentResponse.json();

        // Fetch registrations for this tournament
        const registrationsResponse = await fetch(`${window.PRConfig.API_BASE_URL}/api/tournaments/${tournamentId}/registrations`);
        if (!registrationsResponse.ok) {
            throw new Error('Failed to fetch registrations');
        }
        const registrations = await registrationsResponse.json();

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(tournament.title);
        
        // Add headers
        worksheet.columns = [
            { header: 'Team Name', key: 'teamName', width: 20 },
            { header: 'Team Captain', key: 'teamCaptain', width: 20 },
            { header: 'Contact', key: 'contact', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Player 1 UID', key: 'player1UID', width: 15 },
            { header: 'Player 1 IGN', key: 'player1IGN', width: 20 },
            { header: 'Player 2 UID', key: 'player2UID', width: 15 },
            { header: 'Player 2 IGN', key: 'player2IGN', width: 20 },
            { header: 'Player 3 UID', key: 'player3UID', width: 15 },
            { header: 'Player 3 IGN', key: 'player3IGN', width: 20 },
            { header: 'Player 4 UID', key: 'player4UID', width: 15 },
            { header: 'Player 4 IGN', key: 'player4IGN', width: 20 },
            { header: 'Registration Date', key: 'registrationDate', width: 20 },
            { header: 'Team Experience', key: 'teamExperience', width: 30 },
            { header: 'Achievements', key: 'achievements', width: 30 },
            { header: 'Social Media', key: 'socialMedia', width: 30 },
            { header: 'Notes', key: 'notes', width: 40 }
        ];

        // Add data rows
        registrations.teams.forEach(team => {
            worksheet.addRow({
                teamName: team.name || 'N/A',
                teamCaptain: team.leader || 'N/A',
                contact: team.contact || 'N/A',
                email: team.email || 'N/A',
                player1UID: team.members[0]?.uid || 'N/A',
                player1IGN: team.members[0]?.ign || 'N/A',
                player2UID: team.members[1]?.uid || 'N/A',
                player2IGN: team.members[1]?.ign || 'N/A',
                player3UID: team.members[2]?.uid || 'N/A',
                player3IGN: team.members[2]?.ign || 'N/A',
                player4UID: team.members[3]?.uid || 'N/A',
                player4IGN: team.members[3]?.ign || 'N/A',
                registrationDate: new Date(team.registeredAt).toLocaleString(),
                teamExperience: team.teamExperience || 'N/A',
                achievements: team.achievements || 'N/A',
                socialMedia: team.socialMedia || 'N/A',
                notes: team.notes || 'N/A'
            });
        });

        // Style the worksheet
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4500' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFF' } };

        // Generate Excel file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tournament.title}_registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Show success message
        showNotification('Export completed successfully!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showNotification(error.message || 'Failed to export registrations. Please try again.', 'error');
    } finally {
        // Restore button state
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalBtnText;
        
        // Remove loading overlay
        const loadingDiv = document.querySelector('.loading-spinner');
        if (loadingDiv) {
            document.body.removeChild(loadingDiv);
        }
    }
}

function showCreateEventForm() {
    const adminContent = document.getElementById('admin-content');
    adminContent.innerHTML = `
        <div class="create-event-form">
            <h3>Create New Tournament</h3>
            <form id="create-tournament-form" onsubmit="createTournament(event)" class="responsive-form">
                <div class="form-group-mobile">
                    <input type="text" id="title" placeholder="Tournament Title" required>
                    <textarea id="description" placeholder="Tournament Description" required></textarea>
                </div>
                
                <div class="form-group-mobile">
                    <div class="form-group">
                        <label for="tournamentPoster">Tournament Poster (Image URL or upload)</label>
                        <input type="text" id="tournamentPoster" placeholder="Tournament Poster URL">
                        <input type="file" id="tournamentPosterUpload" accept="image/*" class="file-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="roadmapPoster">Roadmap Poster (Image URL or upload)</label>
                        <input type="text" id="roadmapPoster" placeholder="Roadmap Poster URL">
                        <input type="file" id="roadmapPosterUpload" accept="image/*" class="file-input">
                    </div>
                    
                    <div class="form-group">
                        <label for="prizePoolPoster">Prize Pool Distribution Poster (Image URL or upload)</label>
                        <input type="text" id="prizePoolPoster" placeholder="Prize Pool Poster URL">
                        <input type="file" id="prizePoolPosterUpload" accept="image/*" class="file-input">
                    </div>
                </div>
                
                <div class="form-group-mobile">
                    <div class="date-inputs">
                        <div class="form-group">
                            <label for="startDate">Start Date</label>
                            <input type="datetime-local" id="startDate" required>
                        </div>
                        <div class="form-group">
                            <label for="endDate">End Date</label>
                            <input type="datetime-local" id="endDate" required>
                        </div>
                    </div>
                    
                    <div class="number-inputs">
                        <div class="form-group">
                            <label for="maxTeams">Max Teams</label>
                            <input type="number" id="maxTeams" placeholder="Maximum Teams" required>
                        </div>
                        <div class="form-group">
                            <label for="entryFee">Entry Fee</label>
                            <input type="number" id="entryFee" placeholder="Entry Fee" value="0">
                        </div>
                        <div class="form-group">
                            <label for="prizePool">Prize Pool</label>
                            <input type="number" id="prizePool" placeholder="Prize Pool" required>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="rules">Tournament Rules</label>
                    <textarea id="rules" placeholder="Tournament Rules" required></textarea>
                </div>
                
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