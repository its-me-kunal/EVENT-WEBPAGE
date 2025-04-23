const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Define Schemas
const tournamentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    bannerImage: String,
    startDate: Date,
    endDate: Date,
    entryFee: Number,
    maxTeams: { type: Number, default: 16 },
    teamSize: { type: Number, default: 4 },
    prizePool: Number,
    roomId: String,
    roomPassword: String,
    credentialVisibility: { type: String, default: "before-match" },
    rules: String,
    contactInfo: String,
    streamLink: String,
    roadmap: [{
        name: String,
        date: Date,
        maps: String
    }],
    createdAt: { type: Date, default: Date.now }
});

const Tournament = mongoose.model("Tournament", tournamentSchema);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(async () => {
    console.log("✅ Connected to MongoDB");
    
    try {
        // Check for tournaments
        const tournaments = await Tournament.find();
        console.log(`Found ${tournaments.length} tournaments:`);
        
        if (tournaments.length === 0) {
            console.log("No tournaments found in the database.");
            
            // Create a sample tournament for testing
            const testTournament = new Tournament({
                title: "Test BGMI Tournament",
                description: "This is a test tournament created for debugging purposes",
                startDate: new Date(),
                endDate: new Date(Date.now() + 86400000), // 1 day later
                entryFee: 0,
                maxTeams: 16,
                teamSize: 4,
                prizePool: 10000,
                rules: "This is a test tournament with sample rules.",
                contactInfo: "test@example.com"
            });
            
            await testTournament.save();
            console.log("Created test tournament:", testTournament);
        } else {
            // Print tournament details
            tournaments.forEach((tournament, index) => {
                console.log(`\nTournament ${index + 1}:`);
                console.log(`ID: ${tournament._id}`);
                console.log(`Title: ${tournament.title}`);
                console.log(`Description: ${tournament.description}`);
                console.log(`Start Date: ${tournament.startDate}`);
                console.log(`Max Teams: ${tournament.maxTeams}`);
                console.log(`Created At: ${tournament.createdAt}`);
            });
        }
    } catch (error) {
        console.error("Error checking tournaments:", error);
    } finally {
        // Disconnect from MongoDB
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}).catch(err => {
    console.error("MongoDB Connection Error:", err);
}); 