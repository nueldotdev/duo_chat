require('dotenv').config();
const express = require('express');
const { join } = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');

// models
const { User } = require('./models/models.js');
// Load environment variables from .env file
const secretKey = process.env.JWT_SECRET;
const app = express();
const uri = process.env.DATABASE_URI;
const tokenBlacklist = new Set();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use('/public', express.static(__dirname + '/public'));

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


async function startServer() {
    try {
        mongoose.connect(uri)
            .then(() => {
                console.log('MongoDB connected')

                // Start the server
                port = process.env.PORT || 3000
                app.listen(port, () => {
                    console.log(`Server running on http://localhost:${port}`);
                })
            })
            .catch(err => console.error('MongoDB connection error:', err));


    } catch (error) {
        console.error("Error connecting to database:", error);
    }
}

startServer()