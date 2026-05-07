const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const { validateContact, handleValidationErrors } = require("../middleware/validation");
const nodemailer = require("nodemailer");

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

    // SMTP Configuration
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    let emailSent = false;
    let previewUrl = null;

    if (smtpUser && smtpPass && smtpUser !== "your_email@gmail.com") {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost || "smtp.gmail.com",
          port: parseInt(smtpPort) || 587,
          secure: parseInt(smtpPort) === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        // 1. Send Admin Notification Email
        await transporter.sendMail({
          from: `"Madhuram Jobs Alerts" <${smtpUser}>`,
          to: smtpUser,
          subject: `New Job Inquiry from ${name}`,
          html: `
            <h2>New Job Inquiry Details:</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Contact:</strong> ${contact}</p>
            <p><strong>Message:</strong> ${message || "N/A"}</p>
          `,
        });

        // 2. Send Candidate Instant Greeting Email
        await transporter.sendMail({
          from: `"Madhuram Jobs" <${smtpUser}>`,
          to: email,
          subject: "Thank you for contacting Madhuram Jobs!",
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e3a8a; max-width: 600px; margin: 0 auto; border: 1px solid #eff6ff; border-radius: 12px; padding: 2rem; background-color: #f8fafc;">
              <h2 style="color: #2563eb; margin-top: 0;">Hello ${name},</h2>
              <p>Thank you for reaching out to <strong>Madhuram Jobs Consultancy</strong>!</p>
              <p>We have received your contact details and job application query. One of our senior recruitment specialists will review your profile and contact you within 24-48 hours to discuss suitable career opportunities.</p>
              <hr style="border: none; border-top: 1px dashed #93c5fd; margin: 1.5rem 0;" />
              <p style="font-size: 0.9rem; color: #64748b;">This is an automated confirmation email. Please do not reply directly to this message.</p>
              <p style="font-weight: bold; margin-top: 1.5rem; color: #1e3a8a;">Best Regards,<br>Placement Team<br>Madhuram Jobs</p>
            </div>
          `,
        });

        emailSent = true;
      } catch (err) {
        console.error("Nodemailer Custom SMTP Error:", err);
      }
    } else {
      // Fallback to free ethereal.email dynamic test SMTP so it works out-of-the-box!
      try {
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const info = await transporter.sendMail({
          from: '"Madhuram Jobs Demo" <demo@madhuramjobs.com>',
          to: email,
          subject: "Thank you for contacting Madhuram Jobs (Demo Auto-Reply)!",
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e3a8a; max-width: 600px; margin: 0 auto; border: 1px solid #eff6ff; border-radius: 12px; padding: 2rem; background-color: #f8fafc;">
              <h2 style="color: #2563eb; margin-top: 0;">Hello ${name},</h2>
              <p>Thank you for reaching out to <strong>Madhuram Jobs Consultancy</strong>!</p>
              <p>This is a <strong>Demo Auto-Reply</strong> showing how your instant candidate greetings will work once you configure your real SMTP credentials inside your backend <code>server/.env</code> file!</p>
              <p>One of our senior recruitment specialists will review your profile and contact you within 24-48 hours to discuss suitable career opportunities.</p>
              <hr style="border: none; border-top: 1px dashed #93c5fd; margin: 1.5rem 0;" />
              <p style="font-weight: bold; margin-top: 1.5rem; color: #1e3a8a;">Best Regards,<br>Placement Team<br>Madhuram Jobs</p>
            </div>
          `,
        });

        emailSent = true;
        previewUrl = nodemailer.getTestMessageUrl(info);
        console.log("Demo Greeting Email Sent Successfully!");
        console.log("Preview URL: %s", previewUrl);
      } catch (err) {
        console.error("Nodemailer Ethereal SMTP Error:", err);
      }
    }

    res.status(201).json({
      success: true,
      message: emailSent 
        ? "Your message has been sent successfully and an instant greeting email has been delivered!"
        : "Your message has been sent successfully!",
      emailSent,
      previewUrl,
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
