const express = require("express");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

dotenv.config();
const app = express();
const PORT = 3007; // Use a fixed port to avoid conflicts
console.log("Using fixed port:", PORT);
const MONGO_URI = "mongodb+srv://kunal:1234@cluster0.b5in9nl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const GOOGLE_CLIENT_ID = "429889031258-oua4vuc19jhtd5m4l75p2rm0p90n633t.apps.googleusercontent.com";

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/discord-screenshots';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Update the MongoDB Connection to use the hardcoded connection string
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => console.error("MongoDB Connection Error:", err));

// Define Schemas
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    role: { type: String, default: "user" }
});

const tournamentSchema = new mongoose.Schema({
    title: String,
    description: String,
    startDate: Date,
    endDate: Date,
    maxTeams: Number,
    entryFee: Number,
    prizePool: Number,
    rules: String,
    tournamentPoster: String,
    roadmapPoster: String,
    prizePoolPoster: String,
    registrationOpen: { type: Boolean, default: true },
    roadmap: [{
        name: String,
        date: Date,
        maps: String
    }],
    stages: [{
        name: String,
        date: Date,
        groups: [{
            groupNumber: Number,
            roomId: String,
            roomPassword: String,
            teams: [{
                teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
                teamName: String
            }]
        }],
        status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' }
    }],
    createdAt: { type: Date, default: Date.now }
});

const teamSchema = new mongoose.Schema({
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    name: { type: String, required: true },
    leader: { type: String, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    userEmail: { type: String, required: true },
    members: [{
        uid: { type: String, required: true },
        ign: { type: String, required: true },
        discordScreenshot: String
    }],
    teamExperience: String,
    achievements: String,
    socialMedia: String,
    notes: String,
    registeredAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Tournament = mongoose.model("Tournament", tournamentSchema);
const Team = mongoose.model("Team", teamSchema);

// Middleware
app.use(cors({
    origin: "*", // Allow all origins
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, './')));

// Log all requests
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url} from ${req.ip}`);
    next();
});

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("Authorization header missing or invalid format");
        return res.status(401).json({ success: false, message: "Unauthorized - No token provided" });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        // Simple token verification (for demo purposes)
        const decoded = Buffer.from(token, 'base64').toString().split(':');
        console.log("Decoded token:", decoded);
        
        if (decoded.length < 2 || decoded[1] !== 'admin') {
            console.log("Token validation failed: Not an admin token");
            return res.status(403).json({ success: false, message: "Forbidden - Not an admin token" });
        }
        next();
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({ success: false, message: "Unauthorized - Invalid token" });
    }
};

const USERS = [
    { username: "admin", password: "1234", role: "admin" },
    { username: "user", password: "user123", role: "user" }
];

// Login endpoint for both admin and normal users
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    console.log("Login request received:", { username, password: password ? "***" : undefined });
    
    // Find the user
    const user = USERS.find(u => u.username === username && u.password === password);

    if (user) {
        // Generate a simple token (for demo purposes)
        const tokenData = `${username}:${user.role}:${Date.now()}`;
        console.log("Creating token with data:", tokenData);
        const token = Buffer.from(tokenData).toString('base64');
        console.log("Generated token:", token);
        
        console.log(`Login successful for ${username} with role ${user.role}`);
        
        // Ensure role is properly set in response
        const responseData = { 
            success: true, 
            role: user.role,  // This should be "admin" for admin user
            token: token,
            message: "Login successful" 
        };
        
        console.log("Sending response data:", responseData);
        return res.json(responseData);
    }
    
    console.log(`Login failed for ${username} - Invalid credentials`);
    return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Add a route for /api/auth/admin that redirects to the login endpoint
app.post("/api/auth/admin", (req, res) => {
    // Forward to the login endpoint
    const { username, password } = req.body;
    const user = USERS.find(u => u.username === username && u.password === password);

    if (user) {
        // Generate a simple token (for demo purposes)
        const tokenData = `${username}:${user.role}:${Date.now()}`;
        console.log("Creating token with data:", tokenData);
        const token = Buffer.from(tokenData).toString('base64');
        console.log("Generated token:", token);
        
        return res.json({ 
            success: true, 
            role: user.role, 
            token: token,
            message: "Login successful" 
        });
    }
    return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Google OAuth Login
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

app.post("/api/google-login", async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ success: false, message: "No token provided" });
        }
        
        console.log("Received Google login request with token");
        
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID
        });
        
        const payload = ticket.getPayload();
        if (!payload) {
            return res.status(401).json({ success: false, message: "Invalid token payload" });
        }

        const { email, name } = payload;
        console.log("Google auth successful for:", email);

        // Store user in MongoDB if not already stored
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ name, email, role: "user" });
            await user.save();
            console.log("Created new user:", email);
        }

        return res.json({ 
            success: true, 
            user: { name, email }, 
            role: user.role,
            message: "Login successful"
        });
    } catch (error) {
        console.error("Google Auth Error:", error);
        return res.status(401).json({ 
            success: false, 
            message: "Authentication failed",
            error: error.message 
        });
    }
});

// Tournament Endpoints

// Create tournament (Admin only)
app.post("/api/admin/create-tournament", verifyAdminToken, async (req, res) => {
    try {
        const tournamentData = req.body;
        console.log("Received tournament data:", JSON.stringify(tournamentData, null, 2));
        
        if (!tournamentData.title) {
            return res.status(400).json({ success: false, message: "Tournament title is required" });
        }
        
        // Remove role from data to be saved (if present)
        if (tournamentData.role) {
        delete tournamentData.role;
        }
        
        // Convert MongoDB incompatible fields or create a new tournament object
        const tournamentToSave = {
            title: tournamentData.title,
            description: tournamentData.description,
            startDate: tournamentData.startDate ? new Date(tournamentData.startDate) : null,
            endDate: tournamentData.endDate ? new Date(tournamentData.endDate) : null,
            maxTeams: tournamentData.maxTeams ? parseInt(tournamentData.maxTeams) : 16,
            entryFee: tournamentData.entryFee ? parseFloat(tournamentData.entryFee) : 0,
            prizePool: tournamentData.prizePool ? parseFloat(tournamentData.prizePool) : 0,
            rules: tournamentData.rules,
            tournamentPoster: tournamentData.tournamentPoster || '',
            roadmapPoster: tournamentData.roadmapPoster || '',
            prizePoolPoster: tournamentData.prizePoolPoster || '',
            registrationOpen: true,
            roadmap: tournamentData.roadmap || []
        };
        
        console.log("Saving tournament with data:", tournamentToSave);
        const newTournament = new Tournament(tournamentToSave);
        await newTournament.save();
        
        return res.json({ 
            success: true, 
            message: "Tournament created successfully", 
            tournament: newTournament 
        });
    } catch (error) {
        console.error("Tournament Creation Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to create tournament: " + error.message,
            error: error.message 
        });
    }
});

// Get all tournaments
app.get("/api/tournaments", async (req, res) => {
    try {
        console.log("Fetching all tournaments");
        
        // Check if user has admin rights
        const authHeader = req.headers.authorization;
        let isAdmin = false;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = Buffer.from(token, 'base64').toString().split(':');
                console.log("Decoded token:", decoded);
                if (decoded.length >= 2 && decoded[1] === 'admin') {
                    isAdmin = true;
                }
            } catch (error) {
                console.error("Token decoding error:", error);
            }
        }
        
        // Get all tournaments
        const tournaments = await Tournament.find({});
        console.log(`Found ${tournaments.length} tournaments`);
        
        // Create response data
        const tournamentsWithCounts = await Promise.all(tournaments.map(async tournament => {
            // Get count of registered teams
            const registeredTeams = await Team.countDocuments({ tournamentId: tournament._id });
            
            // Return data
            return {
                id: tournament._id,
                _id: tournament._id,
                title: tournament.title,
                description: tournament.description,
                startDate: tournament.startDate,
                endDate: tournament.endDate,
                maxTeams: tournament.maxTeams,
                entryFee: tournament.entryFee,
                prizePool: tournament.prizePool,
                registrationOpen: tournament.registrationOpen !== false, // Default to true if not set
                registeredTeams: registeredTeams,
                tournamentPoster: tournament.tournamentPoster || '',
                roadmapPoster: tournament.roadmapPoster || '',
                prizePoolPoster: tournament.prizePoolPoster || ''
            };
        }));
        
        console.log("Returning tournaments with counts:", tournamentsWithCounts);
        return res.json(tournamentsWithCounts);
    } catch (error) {
        console.error("Error fetching tournaments:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to fetch tournaments",
            error: error.message 
        });
    }
});

// Get single tournament
app.get("/api/tournaments/:id", async (req, res) => {
    try {
        const tournamentId = req.params.id;
        
        // Check if the ID is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
            console.error("Invalid tournament ID format:", tournamentId);
            return res.status(400).json({ 
                success: false, 
                message: "Invalid tournament ID format" 
            });
        }
        
        const tournament = await Tournament.findById(tournamentId);
        
        if (!tournament) {
            console.log("Tournament not found for ID:", tournamentId);
            return res.status(404).json({ success: false, message: "Tournament not found" });
        }
        
        // Count registered teams for this tournament
        const registeredTeams = await Team.countDocuments({ tournamentId });
        
        // Prepare the response with all necessary fields
        const response = {
            id: tournament._id,
            title: tournament.title || "Unnamed Tournament",
            description: tournament.description || "",
            startDate: tournament.startDate,
            endDate: tournament.endDate,
            entryFee: tournament.entryFee || 0,
            maxTeams: tournament.maxTeams || 16,
            prizePool: tournament.prizePool || 0,
            rules: tournament.rules || "Standard BGMI Tournament Rules apply.",
            registrationOpen: tournament.registrationOpen !== false, // Default to true if not set
            registeredTeams: registeredTeams,
            stages: tournament.stages || [],
            roadmap: tournament.roadmap || [],
            tournamentPoster: tournament.tournamentPoster || '',
            roadmapPoster: tournament.roadmapPoster || '',
            prizePoolPoster: tournament.prizePoolPoster || ''
        };
        
        console.log("Successfully fetched tournament:", tournamentId);
        return res.json(response);
    } catch (error) {
        console.error("Error fetching tournament:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to fetch tournament",
            error: error.message 
        });
    }
});

// Update tournament (Admin only)
app.put("/api/admin/update-tournament/:id", verifyAdminToken, async (req, res) => {
    try {
        const tournamentData = req.body;
        
        // Remove role if present
        if (tournamentData.role) {
            delete tournamentData.role;
        }

        // Process date fields
        if (tournamentData.startDate) {
            tournamentData.startDate = new Date(tournamentData.startDate);
        }
        if (tournamentData.endDate) {
            tournamentData.endDate = new Date(tournamentData.endDate);
        }

        // Ensure poster fields exist
        if (tournamentData.tournamentPoster === undefined) tournamentData.tournamentPoster = '';
        if (tournamentData.roadmapPoster === undefined) tournamentData.roadmapPoster = '';
        if (tournamentData.prizePoolPoster === undefined) tournamentData.prizePoolPoster = '';

        const tournamentId = req.params.id;
        const updatedTournament = await Tournament.findByIdAndUpdate(
            tournamentId, 
            tournamentData,
            { new: true }
        );
        
        if (!updatedTournament) {
            return res.status(404).json({ success: false, message: "Tournament not found" });
        }
        
        return res.json({ 
            success: true, 
            message: "Tournament updated successfully", 
            tournament: updatedTournament 
        });
    } catch (error) {
        console.error("Tournament Update Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to update tournament",
            error: error.message 
        });
    }
});

// Delete tournament (Admin only)
app.delete("/api/admin/delete-tournament/:id", verifyAdminToken, async (req, res) => {
    try {
        const tournamentId = req.params.id;
        
        // Delete the tournament
        const deletedTournament = await Tournament.findByIdAndDelete(tournamentId);
        
        if (!deletedTournament) {
            return res.status(404).json({ success: false, message: "Tournament not found" });
        }
        
        // Delete all teams registered for this tournament
        await Team.deleteMany({ tournamentId });
        
        return res.json({ 
            success: true, 
            message: "Tournament and all registered teams deleted successfully" 
        });
    } catch (error) {
        console.error("Tournament Deletion Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to delete tournament",
            error: error.message 
        });
    }
});

// Team Registration Endpoints

// Register team for tournament
app.post("/api/tournaments/:id/register", upload.fields([
    { name: 'player1-discord', maxCount: 1 },
    { name: 'player2-discord', maxCount: 1 },
    { name: 'player3-discord', maxCount: 1 },
    { name: 'player4-discord', maxCount: 1 }
]), async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const teamData = req.body;
        
        // Check if user is authenticated with Google
        if (!teamData.userEmail) {
            return res.status(401).json({
                success: false,
                message: "Please login with Google to register your team"
            });
        }

        // Check if tournament exists and registration is open
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ 
                success: false, 
                message: "Tournament not found" 
            });
        }

        if (!tournament.registrationOpen) {
            return res.status(400).json({
                success: false,
                message: "Registration is closed for this tournament"
            });
        }
        
        console.log("Received registration data:", teamData); // Debug log
        console.log("Received files:", req.files); // Debug log
        
        // Email validation regex
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        // Validate required fields
        if (!teamData.name || !teamData.leader || !teamData.contact || !teamData.email) {
            console.log("Missing required fields:", { 
                name: teamData.name, 
                leader: teamData.leader, 
                contact: teamData.contact,
                email: teamData.email
            }); // Debug log
            return res.status(400).json({ 
                success: false, 
                message: "Team name, leader name, contact, and email are required" 
            });
        }
        
        // Validate email format
        if (!emailRegex.test(teamData.email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format. Please enter a valid email address."
            });
        }
        
        // Check if tournament is full
        const registeredTeamsCount = await Team.countDocuments({ tournamentId });
        if (registeredTeamsCount >= tournament.maxTeams) {
            return res.status(400).json({ 
                success: false, 
                message: "Tournament is full" 
            });
        }

        // Parse players data
        let players = [];
        try {
            players = JSON.parse(teamData.members);
        } catch (error) {
            console.error("Error parsing players data:", error);
            return res.status(400).json({ 
                success: false, 
                message: "Invalid players data format" 
            });
        }

        // Create new team
        const team = new Team({
            tournamentId,
            name: teamData.name,
            leader: teamData.leader,
            contact: teamData.contact,
            email: teamData.email,
            userEmail: teamData.userEmail, // Store the user's Gmail ID
            members: players,
            teamExperience: teamData.teamExperience,
            achievements: teamData.achievements,
            socialMedia: teamData.socialMedia,
            notes: teamData.notes
        });

        await team.save();

        // Handle Discord screenshots
        if (req.files) {
            for (let i = 1; i <= 4; i++) {
                const fileKey = `player${i}-discord`;
                if (req.files[fileKey] && req.files[fileKey][0]) {
                    team.members[i-1].discordScreenshot = req.files[fileKey][0].path;
                }
            }
            await team.save();
        }

        return res.json({ 
            success: true, 
            message: "Team registered successfully",
            team: team
        });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to register team",
            error: error.message 
        });
    }
});

// Get teams registered for a tournament
app.get("/api/tournaments/:id/registrations", async (req, res) => {
    try {
        const tournamentId = req.params.id;
        
        // Check if tournament exists
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ 
                success: false, 
                message: "Tournament not found" 
            });
        }
        
        // Get registered teams
        const teams = await Team.find({ tournamentId }).sort({ registeredAt: 1 });
        
        return res.json({ 
            success: true, 
            teams: teams.map(team => ({
                id: team._id,
                name: team.name,
                leader: team.leader,
                members: team.members,
                contact: team.contact,
                email: team.email,
                userEmail: team.userEmail || 'Not Available', // Include userEmail with fallback
                registeredAt: team.registeredAt
            }))
        });
    } catch (error) {
        console.error("Error fetching registrations:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to fetch registrations",
            error: error.message 
        });
    }
});

// Remove team from tournament (Admin only)
app.delete("/api/admin/tournaments/:tournamentId/teams/:teamId", verifyAdminToken, async (req, res) => {
    try {
        const { tournamentId, teamId } = req.params;
        
        // Check if tournament exists
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            return res.status(404).json({ 
                success: false, 
                message: "Tournament not found" 
            });
        }
        
        // Delete the team
        const deletedTeam = await Team.findByIdAndDelete(teamId);
        
        if (!deletedTeam) {
            return res.status(404).json({ 
                success: false, 
                message: "Team not found" 
            });
        }
        
        return res.json({ 
            success: true, 
            message: "Team removed successfully" 
        });
    } catch (error) {
        console.error("Team Removal Error:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Failed to remove team",
            error: error.message 
        });
    }
});

// Admin Stats Endpoint
app.get("/api/admin/stats", verifyAdminToken, async (req, res) => {
    try {
        // Get total tournaments
        const totalTournaments = await Tournament.countDocuments();
        
        // Get active tournaments (where endDate is in the future)
        const activeTournaments = await Tournament.countDocuments({
            endDate: { $gt: new Date() }
        });
        
        // Get total registrations across all tournaments
        const totalRegistrations = await Team.countDocuments();
        
        return res.json({
            success: true,
            totalTournaments,
            activeTournaments,
            totalRegistrations
        });
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch admin statistics",
            error: error.message
        });
    }
});

// Add new endpoint to toggle registration status
app.put("/api/tournaments/:id/toggle-registration", verifyAdminToken, async (req, res) => {
    try {
        console.log(`[Toggle Registration] Attempting to toggle registration for tournament ID: ${req.params.id}`);
        
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            console.log(`[Toggle Registration] Tournament not found with ID: ${req.params.id}`);
            return res.status(404).json({ success: false, message: "Tournament not found" });
        }

        // Get the current registration status
        const currentStatus = tournament.registrationOpen;
        console.log(`[Toggle Registration] Current registration status: ${currentStatus ? 'Open' : 'Closed'}`);
        
        // Toggle the status
        tournament.registrationOpen = !currentStatus;
        
        // Save the updated tournament
        await tournament.save();
        
        const newStatus = tournament.registrationOpen;
        console.log(`[Toggle Registration] New registration status: ${newStatus ? 'Open' : 'Closed'}`);

        res.json({
            success: true,
            message: `Registration ${newStatus ? 'opened' : 'closed'} successfully`,
            registrationOpen: newStatus
        });
    } catch (error) {
        console.error(`[Toggle Registration] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add new endpoint to update tournament stages
app.put("/api/tournaments/:id/stages", verifyAdminToken, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) {
            return res.status(404).json({ success: false, message: "Tournament not found" });
        }

        tournament.stages = req.body.stages;
        await tournament.save();

        res.json({
            success: true,
            message: "Tournament stages updated successfully",
            stages: tournament.stages
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add endpoint for /api/events
app.get("/api/events", (req, res) => {
    // Return dummy events
    const events = [
        {
            title: "Weekly Tournament",
            description: "Join our weekly tournament for casual players",
            date: new Date().toLocaleDateString()
        },
        {
            title: "Championship Series",
            description: "The premier competition for serious esports teams",
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
        }
    ];
    
    res.json(events);
});

// Serve index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Server start
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📁 Static files served from: ${path.join(__dirname, './')}`);
    console.log(`🔗 Access your app at http://localhost:${PORT}`);
});