// tournament.js - Frontend functions for BGMI Tournament Registration

// Tournament Display on Main Page
function loadAllTournaments() {
    console.log("Loading tournaments...");
    
    fetch("http://localhost:3007/api/tournaments")
        .then(response => {
            console.log("Response status:", response.status);
            return response.json();
        })
        .then(tournaments => {
            console.log("Tournaments loaded:", tournaments);
            const eventList = document.getElementById("event-list");
            
            if (!eventList) {
                console.error("Event list element not found!");
                return;
            }
            
            eventList.innerHTML = ""; // Clear previous events

            if (!tournaments || tournaments.length === 0) {
                eventList.innerHTML = "<p>No upcoming tournaments available.</p>";
                return;
            }

            tournaments.forEach(tournament => {
                console.log("Processing tournament:", tournament);
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                
                // Format dates
                const startDate = tournament.startDate ? new Date(tournament.startDate).toLocaleDateString() : "TBD";
                
                // Team slots
                const registeredTeams = tournament.registeredTeams || 0;
                const maxTeams = tournament.maxTeams || 16;
                const slotStatus = `${registeredTeams}/${maxTeams} Teams`;
                
                // Prize info
                const prizePool = tournament.prizePool ? `₹${tournament.prizePool}` : "TBD";
                
                // Registration status
                const isRegistrationOpen = tournament.registrationOpen;
                
                // Make sure we're getting the right ID format
                const tournamentId = tournament.id || tournament._id;
                
                // Check if tournament poster exists
                const posterHTML = tournament.tournamentPoster 
                    ? `<div class="event-poster"><img src="${tournament.tournamentPoster}" alt="${tournament.title} Poster"></div>` 
                    : '';
                
                eventCard.innerHTML = `
                    ${posterHTML}
                    <div class="event-info">
                        <h3>${tournament.title || "Unnamed Tournament"}</h3>
                        <p>${tournament.description ? tournament.description.substring(0, 100) : "No description available"}${tournament.description && tournament.description.length > 100 ? '...' : ''}</p>
                        
                        <div class="event-details">
                            <div class="detail-item">
                                <i class="fas fa-calendar"></i>
                                <span>${startDate}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-users"></i>
                                <span>${slotStatus}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-trophy"></i>
                                <span>${prizePool}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-clipboard-check"></i>
                                <span class="registration-status ${isRegistrationOpen ? 'open' : 'closed'}">
                                    ${isRegistrationOpen ? 'Open' : 'Closed'}
                                </span>
                            </div>
                        </div>
                        
                        <button class="btn" onclick="viewTournamentDetails('${tournamentId}')">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                `;
                
                eventList.appendChild(eventCard);
            });
        })
        .catch(error => {
            console.error("Error loading tournaments:", error);
            const eventList = document.getElementById("event-list");
            if (eventList) {
                eventList.innerHTML = "<p>Error loading tournaments. Please try again later.</p>";
            }
        });
}

// View Tournament Details
function viewTournamentDetails(tournamentId) {
    console.log("Viewing tournament details for ID:", tournamentId);
    
    // Show loading state in modal
    const modal = document.getElementById('tournament-modal');
    const modalContent = modal.querySelector('.modal-content');
    
    if (!modalContent) {
        console.error("Modal content element not found!");
        showNotification("Error displaying tournament details. Please try again.", "error");
        return;
    }
    
    modalContent.innerHTML = '<div class="loading-spinner">Loading tournament details...</div>';
    modal.style.display = 'block';
    
    // Get the user's email
    const userEmail = localStorage.getItem("userEmail");
    
    fetch(`http://localhost:3007/api/tournaments/${tournamentId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(tournament => {
            console.log("Tournament details loaded:", tournament);
            
            // Check if registration is open
            const isRegistrationOpen = tournament.registrationOpen;
            const registrationStatus = isRegistrationOpen ? 
                '<span class="registration-status open">Registration Open</span>' : 
                '<span class="registration-status closed">Registration Closed</span>';

            // Basic tournament details HTML
            let tournamentHTML = `
                <div class="tournament-details">
                    <div class="tournament-header">
                        <h2>${tournament.title || 'Unnamed Tournament'}</h2>
                        <button class="close-btn" onclick="closeModal()">&times;</button>
                    </div>
                    
                    ${tournament.tournamentPoster ? 
                        `<div class="tournament-poster">
                            <img src="${tournament.tournamentPoster}" alt="${tournament.title} Poster">
                        </div>` : ''
                    }
                    
                    <div class="tournament-info">
                        <p><strong>Description:</strong> ${tournament.description || 'No description available'}</p>
                        <p><strong>Start Date:</strong> ${new Date(tournament.startDate).toLocaleString()}</p>
                        <p><strong>End Date:</strong> ${new Date(tournament.endDate).toLocaleString()}</p>
                        <p><strong>Entry Fee:</strong> ₹${tournament.entryFee || 'Free'}</p>
                        <p><strong>Prize Pool:</strong> ₹${tournament.prizePool || 'Not specified'}</p>
                        <p><strong>Rules:</strong><br>${tournament.rules || 'No rules specified'}</p>
                        <p><strong>Registration Status:</strong> ${registrationStatus}</p>
                    </div>`;

            // Check if the user is logged in and if there are stages
            if (userEmail && tournament.stages && tournament.stages.length > 0) {
                tournamentHTML += `
                    <div class="team-schedule-section">
                        <h3>Your Team Schedule</h3>
                        <div id="team-schedule-container">
                            <div class="loading-spinner">Checking team registration...</div>
                        </div>
                    </div>`;
            }
            
            // Add roadmap and prize pool posters
            tournamentHTML += `
                    ${tournament.roadmapPoster ? 
                        `<div class="roadmap-poster">
                            <h3>Tournament Roadmap</h3>
                            <img src="${tournament.roadmapPoster}" alt="Tournament Roadmap">
                        </div>` : ''
                    }
                    
                    ${tournament.prizePoolPoster ? 
                        `<div class="prize-pool-poster">
                            <h3>Prize Pool Distribution</h3>
                            <img src="${tournament.prizePoolPoster}" alt="Prize Pool Distribution">
                        </div>` : ''
                    }`;
                    
            // Add registration form if open
            tournamentHTML += `
                    <div class="registration-section">
                        ${!isRegistrationOpen ? 
                            `<div class="registration-closed-message">
                                <h3>Registration is currently closed for this tournament</h3>
                                <p>Please check back later or contact the tournament organizers for more information.</p>
                            </div>` : 
                            `<div class="registration-form">
                                <h3>Team Registration</h3>
                                <form id="registration-form" onsubmit="submitRegistration(event, '${tournamentId}')">
                                    <div class="team-info">
                                        <h4>Team Information</h4>
                                        <input type="text" id="team-name" placeholder="Team Name" required>
                                        <input type="text" id="team-leader" placeholder="Team Leader Name" required>
                                        <input type="tel" id="team-contact" placeholder="Team Leader Contact Number" required>
                                        <input type="email" id="team-email" placeholder="Team Leader Email" required 
                                               pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" 
                                               title="Please enter a valid email address">
                                        <div class="email-validation-message" id="email-validation"></div>
                                    </div>

                                    <div class="player-info">
                                        <h4>Player 1 (Team Leader)</h4>
                                        <input type="text" id="player1-uid" placeholder="Player 1 UID" required>
                                        <input type="text" id="player1-ign" placeholder="Player 1 IGN" required>
                                        <input type="file" id="player1-discord" accept="image/*" required>
                                        <div class="file-preview" id="player1-preview"></div>

                                        <h4>Player 2</h4>
                                        <input type="text" id="player2-uid" placeholder="Player 2 UID" required>
                                        <input type="text" id="player2-ign" placeholder="Player 2 IGN" required>
                                        <input type="file" id="player2-discord" accept="image/*" required>
                                        <div class="file-preview" id="player2-preview"></div>

                                        <h4>Player 3</h4>
                                        <input type="text" id="player3-uid" placeholder="Player 3 UID" required>
                                        <input type="text" id="player3-ign" placeholder="Player 3 IGN" required>
                                        <input type="file" id="player3-discord" accept="image/*" required>
                                        <div class="file-preview" id="player3-preview"></div>

                                        <h4>Player 4</h4>
                                        <input type="text" id="player4-uid" placeholder="Player 4 UID" required>
                                        <input type="text" id="player4-ign" placeholder="Player 4 IGN" required>
                                        <input type="file" id="player4-discord" accept="image/*" required>
                                        <div class="file-preview" id="player4-preview"></div>
                                    </div>

                                    <div class="additional-info">
                                        <h4>Additional Information</h4>
                                        <input type="text" id="team-experience" placeholder="Previous Tournament Experience (Optional)">
                                        <textarea id="team-achievements" placeholder="Team Achievements (Optional)"></textarea>
                                        <input type="text" id="team-social" placeholder="Team Social Media Handle (Optional)">
                                        <textarea id="team-notes" placeholder="Additional Notes (Optional)"></textarea>
                                    </div>

                                    <div class="terms-section">
                                        <label class="terms-checkbox">
                                            <input type="checkbox" required>
                                            I agree to the tournament rules and terms
                                        </label>
                                    </div>

                                    <button type="submit" class="btn">Register Team</button>
                                </form>
                            </div>`
                        }
                    </div>
                </div>`;

            modalContent.innerHTML = tournamentHTML;

            // If user is logged in and there are stages, check team registration
            if (userEmail && tournament.stages && tournament.stages.length > 0) {
                checkTeamRegistration(tournamentId, tournament.stages);
            }

            // Add email validation event listener if registration is open
            if (isRegistrationOpen) {
                const emailInput = document.getElementById('team-email');
                const emailValidation = document.getElementById('email-validation');
                
                if (emailInput && emailValidation) {
                    emailInput.addEventListener('input', function() {
                        const email = this.value;
                        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                        const isValid = emailRegex.test(email);
                        
                        if (isValid) {
                            emailValidation.textContent = '✓ Valid email address';
                            emailValidation.style.color = 'green';
                            this.setCustomValidity('');
                        } else {
                            emailValidation.textContent = '✗ Please enter a valid email address';
                            emailValidation.style.color = 'red';
                            this.setCustomValidity('Please enter a valid email address');
                        }
                    });
                }
                
                // Setup file previews
                setupFilePreviews();
            }
        })
        .catch(error => {
            console.error("Error loading tournament details:", error);
            modalContent.innerHTML = `
                <div class="error-message">
                    <h3>Error Loading Tournament</h3>
                    <p>Unable to load tournament details. Please try again later.</p>
                    <button class="btn" onclick="closeModal()">Close</button>
                </div>
            `;
        });
}

// Function to check if the user's team is registered and show their group/schedule
function checkTeamRegistration(tournamentId, stages) {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
        document.getElementById('team-schedule-container').innerHTML = `
            <div class="not-registered">
                <p>Please log in with Google to see your team schedule.</p>
            </div>`;
        return;
    }

    // Fetch teams for this tournament and check if the user's team is registered
    fetch(`http://localhost:3007/api/tournaments/${tournamentId}/team-registration?email=${encodeURIComponent(userEmail)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.success || !data.teams || data.teams.length === 0) {
                document.getElementById('team-schedule-container').innerHTML = `
                    <div class="not-registered">
                        <p>No teams are registered for this tournament yet.</p>
                    </div>`;
                return;
            }

            // Find the team associated with this user
            const userTeam = data.teams.find(team => team.userEmail === userEmail);
            
            if (!userTeam) {
                document.getElementById('team-schedule-container').innerHTML = `
                    <div class="not-registered">
                        <p>Your team is not registered for this tournament.</p>
                    </div>`;
                return;
            }

            console.log("User team found:", userTeam); // Debug log

            // Team is registered, now check if it's assigned to a group
            let teamScheduleHTML = '';
            let isAssigned = false;

            // Go through all stages and groups to find the team
            stages.forEach(stage => {
                if (!stage.groups || stage.groups.length === 0) return;
                
                console.log("Checking stage:", stage.name); // Debug log

                stage.groups.forEach(group => {
                    if (!group.teams || group.teams.length === 0) return;
                    
                    console.log("Checking group:", group.groupNumber, "with teams:", group.teams); // Debug log

                    // Check if this team is in the group using multiple possible ID forms
                    const teamInGroup = group.teams.find(team => {
                        // Compare by team ID (could be in multiple formats)
                        if (team.teamId === userTeam.id || team.teamId === userTeam._id) {
                            console.log("Team matched by ID"); // Debug log
                            return true;
                        }
                        
                        // Compare by team name for backup
                        if (team.teamName && userTeam.name && 
                            team.teamName.toLowerCase() === userTeam.name.toLowerCase()) {
                            console.log("Team matched by name"); // Debug log
                            return true;
                        }
                        
                        return false;
                    });

                    if (teamInGroup) {
                        console.log("Team found in group:", teamInGroup); // Debug log
                        isAssigned = true;
                        teamScheduleHTML += `
                            <div class="team-schedule-card">
                                <h4>Stage: ${stage.name}</h4>
                                <p><strong>Date:</strong> ${new Date(stage.date).toLocaleString()}</p>
                                <p><strong>Status:</strong> ${stage.status.charAt(0).toUpperCase() + stage.status.slice(1)}</p>
                                <div class="group-details">
                                    <h5>Group ${group.groupNumber} Details</h5>
                                    <p><strong>Your Team:</strong> ${userTeam.name}</p>
                                    ${stage.status !== 'upcoming' || !group.roomId ? '' : 
                                        `<div class="match-credentials">
                                            <p><strong>Room ID:</strong> ${group.roomId}</p>
                                            <p><strong>Room Password:</strong> ${group.roomPassword}</p>
                                        </div>`
                                    }
                                    <p><strong>Total Teams in Group:</strong> ${group.teams.length}</p>
                                </div>
                            </div>`;
                    }
                });
            });

            if (isAssigned) {
                document.getElementById('team-schedule-container').innerHTML = teamScheduleHTML;
            } else {
                document.getElementById('team-schedule-container').innerHTML = `
                    <div class="not-assigned">
                        <p>Your team is registered, but not yet assigned to any group. Check back later.</p>
                    </div>`;
            }
        })
        .catch(error => {
            console.error("Error checking team registration:", error);
            document.getElementById('team-schedule-container').innerHTML = `
                <div class="error-message">
                    <p>Error checking team registration: ${error.message}</p>
                </div>`;
        });
}

// Add close modal function if not exists
function closeModal() {
    const modal = document.getElementById('tournament-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupFilePreviews() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const preview = document.getElementById(this.id + '-preview');
            const file = e.target.files[0];
            
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    preview.innerHTML = `
                        <img src="${e.target.result}" alt="Discord Profile Preview" style="max-width: 200px; margin-top: 10px;">
                        <p class="file-name">${file.name}</p>
                    `;
                }
                reader.readAsDataURL(file);
            }
        });
    });
}

function submitRegistration(event, tournamentId) {
    event.preventDefault();
    
    // Get user's Gmail ID and token from localStorage
    const userEmail = localStorage.getItem("userEmail");
    const token = localStorage.getItem("token");
    
    if (!userEmail || !token) {
        showNotification('Please log in with Google to register.', 'error');
        return;
    }
    
    // Validate form data
    const teamName = document.getElementById('team-name').value.trim();
    const teamLeader = document.getElementById('team-leader').value.trim();
    const teamContact = document.getElementById('team-contact').value.trim();
    const teamEmail = document.getElementById('team-email').value.trim();

    console.log("Form data:", { teamName, teamLeader, teamContact, teamEmail }); // Debug log

    if (!teamName || !teamLeader || !teamContact || !teamEmail) {
        showNotification('Please fill in all required team information.', 'error');
        return;
    }

    // Validate player data
    const players = [];
    for (let i = 1; i <= 4; i++) {
        const uid = document.getElementById(`player${i}-uid`).value.trim();
        const ign = document.getElementById(`player${i}-ign`).value.trim();
        const discordFile = document.getElementById(`player${i}-discord`).files[0];

        console.log(`Player ${i} data:`, { uid, ign, hasDiscordFile: !!discordFile }); // Debug log

        if (!uid || !ign || !discordFile) {
            showNotification(`Please fill in all required information for Player ${i}.`, 'error');
            return;
        }

        players.push({
            uid: uid,
            ign: ign
        });
    }
    
    // Create FormData object
    const formData = new FormData();
    
    // Add team information
    formData.append('name', teamName);
    formData.append('leader', teamLeader);
    formData.append('contact', teamContact);
    formData.append('email', teamEmail);
    formData.append('userEmail', userEmail); // Add user's Gmail ID
    
    // Add player information
    formData.append('members', JSON.stringify(players));
    
    // Add additional information
    formData.append('teamExperience', document.getElementById('team-experience').value.trim());
    formData.append('achievements', document.getElementById('team-achievements').value.trim());
    formData.append('socialMedia', document.getElementById('team-social').value.trim());
    formData.append('notes', document.getElementById('team-notes').value.trim());

    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Registering...';
    submitButton.disabled = true;

    // Log the FormData contents for debugging
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    // Submit the form data to the server
    fetch(`http://localhost:3007/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Registration success:', data); // Debug log
        if (data.success) {
            showNotification('Registration successful! We will contact you soon.', 'success');
            closeModal();
        } else {
            showNotification(data.message || 'Registration failed. Please try again.', 'error');
        }
    })
    .catch(error => {
        console.error("Error submitting registration:", error);
        showNotification("Error submitting registration. Please try again later.", "error");
        
        // Re-enable the submit button
        submitButton.disabled = false;
        submitButton.innerHTML = "Register Team";
    });
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

// Add notification styles
const style = document.createElement('style');
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

// Helper Functions
function formatDateTime(dateString) {
    if (!dateString) return "TBD";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function renderRoadmap(roadmap) {
    if (!roadmap || roadmap.length === 0) {
        return "<p>Roadmap details will be announced soon</p>";
    }
    
    let roadmapHTML = '<div class="roadmap-timeline">';
    roadmap.forEach((stage, index) => {
        roadmapHTML += `
            <div class="roadmap-stage">
                <div class="stage-number">${index + 1}</div>
                <div class="stage-details">
                    <h4>${stage.name || `Stage ${index + 1}`}</h4>
                    <p>${formatDateTime(stage.date)}</p>
                    <p>Maps: ${stage.maps || 'TBD'}</p>
                </div>
            </div>
        `;
    });
    roadmapHTML += '</div>';
    
    return roadmapHTML;
}

// Function to scroll to events section
function scrollToEvents() {
    console.log("Scrolling to events section...");
    const tournamentsSection = document.getElementById('tournaments-section');
    if (tournamentsSection) {
        const yOffset = -100; // Offset to account for header
        const y = tournamentsSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
        
        window.scrollTo({
            top: y,
            behavior: 'smooth'
        });
    } else {
        console.error('Tournaments section not found');
    }
}

// Make sure tournaments load when page is ready
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded");
    
    if (document.getElementById("event-list")) {
        console.log("Event list found, loading tournaments...");
        loadAllTournaments();
    } else {
        console.log("Event list element not found on this page");
    }
    
    // Also load tournaments after successful login
    if (localStorage.getItem("loggedIn") === "true") {
        console.log("User is logged in, showing main content");
        const mainContent = document.getElementById("main-content");
        if (mainContent) {
            mainContent.style.display = "block";
            loadAllTournaments();
        }
    }
}); 