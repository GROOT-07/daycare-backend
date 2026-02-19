const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { Parser } = require("json2csv");

const app = express();
app.use(cors());
app.use(express.json());

// Firebase init
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
});

const db = admin.firestore();
const BOOKINGS = db.collection("bookings");

// Get all bookings
app.get("/bookings", async (req, res) => {
  const snapshot = await BOOKINGS.get();
  const data = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  res.json(data);
});

// Book slot
app.post("/book", async (req, res) => {
  const { date, time, name, age, phone } = req.body;

  if (!date || !time || !name || !age || !phone) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const existing = await BOOKINGS
    .where("date", "==", date)
    .where("time", "==", time)
    .get();

  if (existing.size >= 5) {
    return res.status(400).json({ message: "Slot full" });
  }

  await BOOKINGS.add({ date, time, name, age, phone });
  res.json({ message: "Booked" });
});

// Delete booking
app.delete("/booking/:id", async (req, res) => {
  await BOOKINGS.doc(req.params.id).delete();
  res.json({ message: "Deleted" });
});

// Export CSV
app.get("/export", async (req, res) => {
  const snapshot = await BOOKINGS.get();
  const data = snapshot.docs.map(doc => doc.data());

  const parser = new Parser();
  const csv = parser.parse(data);

  res.header("Content-Type", "text/csv");
  res.attachment("bookings.csv");
  res.send(csv);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on", PORT));
