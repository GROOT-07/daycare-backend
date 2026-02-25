console.log("Geriatric Daycare Backend - Starting...");

const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "https://daycare-frontend-kappa.vercel.app",
    "http://localhost:3000"  // for local dev
  ],
  methods: ["GET", "POST", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

// ── In-memory store (replace with Firebase if you want persistence) ────────────
// NOTE: On Render free tier, data resets on sleep. 
// To persist, wire up firebase-admin Firestore below.
let bookings = [];

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Geriatric Daycare Backend Running" });
});

// ── GET /bookings — return all bookings ───────────────────────────────────────
app.get("/bookings", (req, res) => {
  res.json(bookings);
});

// ── POST /book — create a new booking ────────────────────────────────────────
// Body: { name, age, phone, slots: ["Monday|9:00–10:00 AM", ...] }
app.post("/book", (req, res) => {
  const { name, age, phone, slots } = req.body;

  // Validation
  if (!name || !age || !phone || !slots || !Array.isArray(slots) || slots.length === 0) {
    return res.status(400).json({ message: "Missing required fields: name, age, phone, slots[]" });
  }

  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    return res.status(400).json({ message: "Age must be between 1 and 120" });
  }

  const phone_clean = String(phone).replace(/\D/g, "");
  if (phone_clean.length < 7 || phone_clean.length > 15) {
    return res.status(400).json({ message: "Invalid phone number" });
  }

  // Check for duplicate slots (prevent double booking)
  const alreadyTaken = bookings.flatMap(b => b.slots);
  const conflicts = slots.filter(s => alreadyTaken.includes(s));
  if (conflicts.length > 0) {
    return res.status(409).json({
      message: "Some slots are already booked",
      conflicts
    });
  }

  const booking = {
    id: uuidv4(),
    name: name.trim(),
    age: ageNum,
    phone: phone.trim(),
    slots,             // e.g. ["Monday|9:00–10:00 AM", "Wednesday|10:00–11:00 AM"]
    bookedAt: new Date().toISOString()
  };

  bookings.push(booking);
  console.log(`New booking: ${booking.name} — ${booking.slots.join(", ")}`);
  res.status(201).json({ message: "Booked successfully", booking });
});

// ── DELETE /bookings/:id — cancel a booking ───────────────────────────────────
app.delete("/bookings/:id", (req, res) => {
  const { id } = req.params;
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) {
    return res.status(404).json({ message: "Booking not found" });
  }
  bookings.splice(index, 1);
  res.json({ message: "Booking cancelled" });
});

// ── GET /export — download bookings as CSV ────────────────────────────────────
app.get("/export", (req, res) => {
  const escape = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;

  const rows = [["ID", "Name", "Age", "Phone", "Day", "Slot", "Booked At"]];
  bookings.forEach(b => {
    b.slots.forEach(s => {
      const [day, slot] = s.split("|");
      rows.push([b.id, b.name, b.age, b.phone, day, slot, new Date(b.bookedAt).toLocaleString("en-IN")]);
    });
  });

  const csv = rows.map(r => r.map(escape).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=bookings-${new Date().toISOString().slice(0,10)}.csv`);
  res.send(csv);
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
