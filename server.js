require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors({ origin: '*' }));  // Allow requests from your GitHub Pages site
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Visit Schema
const visitSchema = new mongoose.Schema({
  ip: String,
  city: String,
  country: String,
  lat: Number,
  lon: Number,
  timestamp: { type: Date, default: Date.now }
});
const Visit = mongoose.model('Visit', visitSchema);

// API Endpoint
app.post('/api/visit', async (req, res) => {
  try {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip) {
      ip = ip.split(',')[0].trim();  // Take only the first IP and trim spaces
    }

    const geoResponse = await axios.get(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN}`);
    const { city, country, loc } = geoResponse.data;
    const [lat, lon] = loc ? loc.split(',').map(Number) : [0, 0];

    // Add only unique IPs (for unique visitors; remove !existing for total hits)
    const existing = await Visit.findOne({ ip });
    if (!existing) {
      const newVisit = new Visit({ ip, city, country, lat, lon });
      await newVisit.save();
    }

    const totalVisits = await Visit.countDocuments();
    const allVisits = await Visit.find({}, { _id: 0, city: 1, country: 1, lat: 1, lon: 1 });

    res.json({ totalVisits, visits: allVisits });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to log visit' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));