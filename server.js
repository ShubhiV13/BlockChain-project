const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { Block, Blockchain } = require("./blockchain");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const medicalChain = new Blockchain();

// ➕ Add Record
app.post("/add-record", (req, res) => {
  const { patientName, diagnosis, treatment, date } = req.body;
  if (!patientName || !diagnosis || !treatment || !date) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const index = medicalChain.chain.length;
  const timestamp = new Date().toLocaleString();
  const data = { patientName, diagnosis, treatment, date, deleted: false };
  const newBlock = new Block(index, timestamp, data);
  medicalChain.addBlock(newBlock);

  console.log("✅ Added record:", patientName);
  res.json({ message: "Record added successfully!" });
});

// ✏️ Edit Record
app.post("/edit-record", (req, res) => {
  const { patientName, diagnosis, treatment, date } = req.body;
  if (!patientName) return res.status(400).json({ message: "Patient name required!" });

  const index = medicalChain.chain.length;
  const timestamp = new Date().toLocaleString();
  const data = { patientName, diagnosis, treatment, date, deleted: false };
  const newBlock = new Block(index, timestamp, data);
  medicalChain.addBlock(newBlock);

  console.log("✏️ Edited record:", patientName);
  res.json({ message: "Record updated successfully!" });
});

// 🗑️ Delete Record
app.post("/delete-record", (req, res) => {
  const { patientName } = req.body;
  if (!patientName) return res.status(400).json({ message: "Patient name required!" });

  const index = medicalChain.chain.length;
  const timestamp = new Date().toLocaleString();
  const data = { patientName, deleted: true };
  const newBlock = new Block(index, timestamp, data);
  medicalChain.addBlock(newBlock);

  console.log("🗑️ Deleted record:", patientName);
  res.json({ message: "Record deleted successfully!" });
});

// 📋 Get Records (latest only)
app.get("/records", (req, res) => {
  const latestRecords = {};
  medicalChain.chain.forEach((block) => {
    if (block.index === 0) return; // skip genesis
    const { patientName, deleted } = block.data;
    latestRecords[patientName] = { ...block, deleted };
  });

  const activeRecords = Object.values(latestRecords).filter((r) => !r.deleted);
  res.json(activeRecords);
});

app.listen(3000, () =>
  console.log("🚀 Server running at http://localhost:3000")
);
