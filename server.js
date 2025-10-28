const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { Block, Blockchain } = require("./blockchain");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "public")));

const medicalChain = new Blockchain();

// Get all records
app.get("/records", (req, res) => {
  res.json(medicalChain.chain);
});

// Add a new medical record
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

// Serve index.html when visiting root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 App running on port ${PORT}`)
);
