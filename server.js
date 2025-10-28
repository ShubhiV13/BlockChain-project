const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Block, Blockchain } = require("./blockchain");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.static("public"));

const medicalChain = new Blockchain();

app.get("/records", (req, res) => {
  res.json(medicalChain.chain);
});

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

app.listen(3000, () =>
  console.log("🚀 Medical Blockchain app running at http://localhost:3000")
);
