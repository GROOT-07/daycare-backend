console.log("RENDER FINAL FIX – COMMONJS MODE");

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "https://daycare-frontend-kappa.vercel.app"
  ],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

let bookings = [];

app.get("/", (req, res) => {
  res.send("Geriatric Daycare Backend Running");
});

app.post("/book", (req, res) => {
  const { date, time, name, age, phone } = req.body;

  if (!date || !time || !name || !phone) {
    return res.status(400).json({ message: "Missing fields" });
  }

  bookings.push({ date, time, name, age, phone });
  res.json({ message: "Booked successfully" });
});

app.get("/bookings", (req, res) => {
  res.json(bookings);
});

app.get("/export", (req, res) => {
  let csv = "Date,Time,Name,Age,Phone\n";
  bookings.forEach(b => {
    csv += `${b.date},${b.time},${b.name},${b.age},${b.phone}\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=bookings.csv");
  res.send(csv);
});

app.listen(process.env.PORT || 5000);