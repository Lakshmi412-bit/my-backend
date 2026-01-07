const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Message = require("./Message");  // Added for MongoDB
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected!"))
.catch((err) => console.error("MongoDB connection error:", err));

// --- Certificate Schema ---
const certificateSchema = new mongoose.Schema({
    title: String,
    issuer: String,
    year: Number,
    description: String
});

const Certificate = mongoose.model("Certificate", certificateSchema);

// --- Certificate APIs ---
// GET all certificates
app.get("/api/certificates", async (req, res) => {
    try {
        const certificates = await Certificate.find();
        res.json(certificates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST a new certificate
app.post("/api/certificates", async (req, res) => {
    const { title, issuer, year, description } = req.body;
    const newCert = new Certificate({ title, issuer, year, description });
    try {
        const savedCert = await newCert.save();
        res.status(201).json(savedCert);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- Contact API (existing) ---
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // 1️⃣ Save to MongoDB
    const newMessage = new Message({ name, email, message });
    await newMessage.save();

    // 2️⃣ Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    });

    await transporter.sendMail({
      from: email,
      to: process.env.EMAIL,
      subject: `New Portfolio Message from ${name}`,
      html: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
      `,
    });

    res.status(200).json({ success: true, message: "Message saved and sent successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Message failed to send" });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
