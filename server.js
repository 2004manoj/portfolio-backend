// ✅ Load environment variables
require('dotenv').config();

// ✅ Import packages
const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');

// ✅ Initialize app
const app = express();

// ✅ CORS Setup (allow Netlify frontend)
app.use(cors({
    origin: ['https://lustrous-kitsune-433d9b.netlify.app'],
    methods: ['POST', 'GET'],
    credentials: true
}));

// ✅ Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ✅ Connect to MongoDB (Add options for compatibility)
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Define Schema & Model
const messageSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    date: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// ✅ POST /contact Route
app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    try {
        // Save message to MongoDB
        const newMessage = new Message({ name, email, message });
        await newMessage.save();
        console.log('✅ Message saved to MongoDB');

        // Email setup
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Change if forwarding
            subject: `New Message from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
        });

        console.log('✅ Email sent');
        res.status(200).json({ success: true, message: 'Message received and email sent successfully' });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Server error, please try again' });
    }
});

// ✅ Health check route
app.get('/', (req, res) => {
    res.send('🚀 Server is running...');
});

// ✅ Start server (Render needs 0.0.0.0)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
