const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const { validateContact, handleValidationErrors } = require("../middleware/validation");

// POST: Create a new contact
router.post("/", validateContact, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, contact, message } = req.body;

    // Create new contact
    const newContact = new Contact({
      name,
      email,
      contact,
      message: message || "",
    });

    // Save to database
    await newContact.save();

    res.status(201).json({
      success: true,
      message: "Your message has been sent successfully!",
      data: newContact,
    });
  } catch (error) {
    console.error("Error saving contact:", error);
    res.status(500).json({
      success: false,
      message: "Error saving your message. Please try again.",
      error: error.message,
    });
  }
});

// GET: Get all contacts (optional - for admin purposes)
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving contacts",
      error: error.message,
    });
  }
});

module.exports = router;
