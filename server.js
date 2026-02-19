const express = require("express");
const cors = require("cors");

const app = express();

/* Middlewares */
app.use(cors());
app.use(express.json());

/* ROOT HEALTH CHECK */
app.get("/", (req, res) => {
  res.status(200).send("Geriatric Daycare Backend is LIVE 🚀");
});

/* BOOK SLOT */
app.post("/book", (req, res) => {
  console.log("POST /book hit", req.body);

  res.status(200).json({
    success: true,
    message: "Booking received",
    data: req.body
  });
});

/* EXPORT (placeholder) */
app.get("/export", (req, res) => {
  res.status(200).json({ message: "Export route working" });
});

/* START SERVER */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
