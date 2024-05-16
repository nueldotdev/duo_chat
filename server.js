require('dotenv').config();
const express = require('express');
const { join } = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const socketIo = require('socket.io');
const http = require('http');

// models
const { User, Room, Request, Message } = require('./models/models.js');
// Load environment variables from .env file
const secretKey = process.env.JWT_SECRET;
const uri = process.env.DATABASE_URI;
const tokenBlacklist = new Set();

const app = express();
const server = http.createServer(app);

async function searchUsers(username) {
    // Use a MongoDB query to find users matching the provided username
    const searchResults = await User.find({ username: { $regex: username, $options: 'i' } });
    return searchResults;
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/public'));
// app.use('/socket.io', express.static(__dirname + '/node_modules/socket.io-client/dist'));

app.use((req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (token) {
      if (tokenBlacklist.has(token)) {
        res.sendStatus(401);
      } else {
        next();
      }
    } else {
        next();
    }`q`
});

// Get
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'views', 'index.html'));
})

app.get('/home', (req, res) => {
    res.sendFile(join(__dirname, 'views', 'home.html'));
})

app.get('/login', (req, res) => {
    res.sendFile(join(__dirname, 'views', 'login.html'));
})

app.get('/register', (req, res) => {
    res.sendFile(join(__dirname, 'views', 'register.html'));
})

// Protected endpoint to get user information
app.get('/user', async (req, res) => {
    // Extract JWT token from request headers
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        console.log({ message: 'Authorization token not provided' })
        return res.status(401).json({ message: 'Authorization token not provided' });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, secretKey);

        // Find user in database based on decoded user ID
        const user = await User.findById(decoded.userId);

        if (!user) {
            console.log({ message: 'User not found' })
            return res.status(404).json({ message: 'User not found' });
        }

        // Return user information
        res.json({ user });
    } catch (error) {
        console.log({ error: error.message })
        return res.status(403).json({ message: 'Invalid token' });
    }
});

app.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    res.json({ user });
})

// Express route for handling user search
app.get('/search', async (req, res) => {
    const { username } = req.query;
    console.log(`Query = ${username}`)
    try {
        // Call a function to search users in the database based on the provided username
        const users = await User.find({ username: { $regex: username, $options: 'i' } });

        res.status(200).json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});


// Route to verify JWT token
app.get('/verify-token', (req, res) => {
    // Extract token from request headers
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        console.log({ message: 'Authorization token not provided' })
        return res.status(401).json({ message: 'Authorization token not provided' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, secretKey);

        // If verification is successful, return decoded payload
        res.status(200).json({ decoded });
    } catch (error) {
        // If verification fails, return error response
        console.log({ error: error.message })
        res.status(403).json({ message: 'Invalid token' });
    }
});


// Post
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log({ username, email, password })
        // Ensure that req.body.password exists and is not empty
        if (!req.body.password) {
            return res.status(400).json({ message: 'Password is required' });
        }
        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create a new user
        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hashedPassword
        });

        // Save the user to the database
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.log({ error: error.message })
        res.status(500).json({ message: 'Failed to register user', error: error.message });
    }
});

app.post('/login', async (req, res) => {
    try {
        // Find the user by username
        const user = await User.findOne({ username: req.body.username });

        // If user not found or password doesn't match, return error
        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            console.log({ error: "Invalid Parameters" })
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id, email: user.email }, secretKey, { expiresIn: '1d' });

        // Send the token to the client
        res.status(200).json({ message: 'Login successful', token: token });
    } catch (error) {
        res.status(500).json({ message: 'Failed to login', error: error.message });
        console.log({ error: error.message })
    }
})

// logout
app.post('/logout', (req, res) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (token) {
      tokenBlacklist.add(token); // Add token to blacklist
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  });



// Send request
app.post('/send-request', async (req, res) => {
    try {
        const { senderId, recipientId } = req.body;

        // Check if the sender and recipient exist
        const sender = await User.findById(senderId);
        const recipient = await User.findById(recipientId);

        if (!sender || !recipient) {
            return res.status(404).json({ message: 'Sender or recipient not found' });
        }

        // Check if a request already exists between these users
        const existingRequest = await Request.findOne({
            sender: senderId,
            recipient: recipientId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ message: 'Request already sent' });
        }

        // Create a new request
        const newRequest = new Request({
            sender: senderId,
            recipient: recipientId
        });

        await newRequest.save();

        res.status(200).json({ message: 'Request sent successfully' });
    } catch (error) {
        console.error('Error sending request:', error);
        res.status(500).json({ error: 'Failed to send request' });
    }
});

// Accept request
app.post('/accept-request', async (req, res) => {
    try {
        const { requestId } = req.body;
        // console.log(requestId)

        // Find the request
        const request = await Request.findById(requestId);

        if (!request || request.status !== 'pending') {
            return res.status(404).json({ message: 'Request not found or already accepted/declined' });
        }

        // Update request status to accepted
        request.status = 'accepted';
        await request.save();

        // Add sender to recipient's contacts and recipient to sender's contacts
        await Promise.all([
            User.findByIdAndUpdate(request.sender, { $addToSet: { contacts: request.recipient } }),
            User.findByIdAndUpdate(request.recipient, { $addToSet: { contacts: request.sender } })
        ]);

        res.status(200).json({ message: 'Request accepted successfully' });
    } catch (error) {
        console.error('Error accepting request:', error);
        res.status(500).json({ error: 'Failed to accept request' });
    }
});


// Endpoint to get all requests for the active user
app.get('/user-requests/:id', async (req, res) => {
    try {
        const userId = req.params.id; // Assuming req.user contains information about the active user

        // Find all requests where the active user is either the sender or recipient
        const requests = await Request.find({ $or: [{ sender: userId }, { recipient: userId }] });

        res.status(200).json({ requests });
    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ error: 'Failed to fetch requests' });
    }
});
// Functions
function getRoomId(userId1, userId2) {
    // Sort the user IDs to ensure consistency
    const sortedIds = [userId1, userId2].sort();
    // Concatenate the sorted user IDs to create a unique room ID
    return sortedIds.join('_');
}

// Socket.IO code
const io = socketIo(server);


io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for chat messages from clients
    socket.on('chatMessage', (message) => {
        

        // Broadcast the message to all connected clients, including the sender
        io.emit('chatMessage', message);
    });

    socket.on('open-chat', async (info) => {
        // console.log("open-chat: ", info)
        try {
            const { senderId, reciepientId } = info;
            const sender = await User.findById(senderId);
            const reciepient = await User.findById(reciepientId);
            const roomId = getRoomId(sender._id, reciepient._id);

            // Check if the room already exists
            let room = await Room.findOne({ key: roomId });

            // If the room doesn't exist, create it
            if (!room) {
                room = new Room({
                    key: roomId,
                    participants: [sender, reciepient] // Store user objects as participants
                });
                await room.save();
            }

            io.emit('open-chat', {room, reciepient});
        } catch (error) {
            console.error('Room:', error);
        }

    })

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});





async function startServer() {
    try {
        mongoose.connect(uri)
            .then(() => {
                console.log('MongoDB connected')

                // Start the server
                port = process.env.PORT || 3000
                server.listen(port, () => {
                    console.log(`Server running on http://localhost:${port}`);
                })
            })
            .catch(err => console.error('MongoDB connection error:', err));


    } catch (error) {
        console.error("Error connecting to database:", error);
    }
}

startServer()