const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { Block, Blockchain } = require("./blockchain");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Serve frontend files (HTML, JS, etc.)
app.use(express.static(path.join(__dirname, "public")));

const medicalChain = new Blockchain();

// Route: Get all records
app.get("/records", (req, res) => {
  res.json(medicalChain.chain);
});

// Route: Add a new medical record
app.post("/add-record", (req, res) => {
  const { patientName, diagnosis, treatment, date } = req.body;

  if (!patientName || !diagnosis || !treatment || !date) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const index = medicalChain.chain.length;
  const timestamp = new Date().toLocaleString();
  const data = { patientName, diagnosis, treatment, date };

  const newBlock = new Block(index, timestamp, data);
  medicalChain.addBlock(newBlock);

  console.log("✅ Added record for:", patientName);
  res.json({ message: "Medical record added successfully!" });
});

// Serve index.html on the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Medical Blockchain app running at http://localhost:${PORT}`)
);
