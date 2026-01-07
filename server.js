const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const Message = require("./Message");
require("dotenv").config();

const app = express();

// ✅ CORS for Netlify
app.use(
  cors({
    origin: "https://nagasailakshmiportfolio.netlify.app",
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

// ✅ MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// ================= CONTACT API =================
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Save message
    await Message.create({ name, email, message });

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: email,
      to: process.env.EMAIL_USER,
      subject: `Portfolio Message from ${name}`,
      html: `
        <h3>New Contact Message</h3>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p>${message}</p>
      `,
    });

    res.json({ message: "Message sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Message failed to send" });
  }
});

// ================= CERTIFICATE APIs =================
const certificateSchema = new mongoose.Schema({
  title: String,
  issuer: String,
  year: Number,
  description: String,
});

const Certificate = mongoose.model("Certificate", certificateSchema);

app.get("/api/certificates", async (req, res) => {
  const certificates = await Certificate.find();
  res.json(certificates);
});

app.post("/api/certificates", async (req, res) => {
  const cert = new Certificate(req.body);
  await cert.save();
  res.status(201).json(cert);
});

// ✅ REQUIRED FOR RENDER
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
