const express = require('express');
const router = express.Router();
const User = require('../models/user');
const { jwtAuthMiddleware } = require('../jwt'); // Assuming JWT middleware
const Candidate = require('../models/candidate');

// Helper function to check if the user has an admin role
const checkAdminRole = async (userID) => {
    try {
        const user = await User.findById(userID);
        return user && user.role === 'admin';
    } catch (err) {
        console.error(err);
        return false;
    }
};

// POST route to add a candidate (Admin only)
router.post('/', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!(await checkAdminRole(req.user.id))) {
            return res.status(403).json({ message: 'User does not have admin role' });
        }

        const candidateData = req.body; // Assuming the request body contains the candidate data
        const newCandidate = new Candidate(candidateData); // Create a new candidate

        // Save the new candidate to the database
        const savedCandidate = await newCandidate.save();
        res.status(200).json({ response: savedCandidate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT route to update a candidate's information (Admin only)
router.put('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!(await checkAdminRole(req.user.id))) {
            return res.status(403).json({ message: 'User does not have admin role' });
        }

        const candidateID = req.params.candidateID;
        const updatedCandidateData = req.body; // Updated data for the candidate

        const updatedCandidate = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true // Run Mongoose validation
        });

        if (!updatedCandidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        res.status(200).json(updatedCandidate);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE route to remove a candidate (Admin only)
router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try {
        if (!(await checkAdminRole(req.user.id))) {
            return res.status(403).json({ message: 'User does not have admin role' });
        }

        const candidateID = req.params.candidateID;
        const deletedCandidate = await Candidate.findByIdAndDelete(candidateID);

        if (!deletedCandidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        res.status(200).json({ message: 'Candidate deleted', candidate: deletedCandidate });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST route to vote for a candidate (No admin can vote, and user can only vote once)
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
    const candidateID = req.params.candidateID;
    const userID = req.user.id;

    try {
        // Find the candidate
        const candidate = await Candidate.findById(candidateID);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Find the user
        const user = await User.findById(userID);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user is an admin
        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Admin is not allowed to vote' });
        }

        // Check if the user has already voted
        if (user.isVoted) {
            return res.status(400).json({ message: 'You have already voted' });
        }

        // Record the vote
        candidate.votes.push({ user: userID });
        candidate.voteCount++;
        await candidate.save();

        // Mark the user as having voted
        user.isVoted = true;
        await user.save();

        res.status(200).json({ message: 'Vote recorded successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET route to retrieve vote count for all candidates
router.get('/vote/count', async (req, res) => {
    try {
        // Find all candidates and sort them by voteCount in descending order
        const candidates = await Candidate.find().sort({ voteCount: -1 });

        // Map the candidates to return only party and voteCount
        const voteRecord = candidates.map(candidate => ({
            party: candidate.party,
            count: candidate.voteCount
        }));

        res.status(200).json(voteRecord);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET route to list all candidates with name and party fields
router.get('/', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields
        const candidates = await Candidate.find({}, 'name party');

        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
