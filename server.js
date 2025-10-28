const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { Block, Blockchain } = require("./blockchain");

const app = express();

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

const medicalChain = new Blockchain();

// Input validation middleware
const validateMedicalRecord = (req, res, next) => {
  const { patientName, diagnosis, treatment, date } = req.body;
  
  if (!patientName || patientName.trim().length < 2) {
    return res.status(400).json({ error: "Valid patient name required (min 2 characters)" });
  }
  
  if (!diagnosis || diagnosis.trim().length < 2) {
    return res.status(400).json({ error: "Valid diagnosis required" });
  }
  
  if (!treatment || treatment.trim().length < 2) {
    return res.status(400).json({ error: "Valid treatment required" });
  }
  
  if (!date || isNaN(new Date(date).getTime())) {
    return res.status(400).json({ error: "Valid date required" });
  }
  
  // Sanitize inputs
  req.body.patientName = patientName.trim().substring(0, 100);
  req.body.diagnosis = diagnosis.trim().substring(0, 500);
  req.body.treatment = treatment.trim().substring(0, 500);
  
  next();
};

// ➕ Add Record
app.post("/add-record", validateMedicalRecord, (req, res) => {
  const { patientName, diagnosis, treatment, date } = req.body;

  try {
    const patientId = medicalChain.generatePatientId(patientName);
    const index = medicalChain.chain.length;
    const timestamp = new Date().toISOString();
    const data = { 
      patientId, 
      patientName, 
      diagnosis, 
      treatment, 
      date, 
      deleted: false,
      type: "create",
      recordId: medicalChain.generateRecordId()
    };
    
    const newBlock = new Block(index, timestamp, data);
    medicalChain.addBlock(newBlock);

    console.log("✅ Added record for:", patientName, "ID:", patientId);
    res.json({ 
      success: true,
      message: "Record added successfully!",
      patientId: patientId,
      blockHash: newBlock.hash
    });
  } catch (error) {
    console.error("Error adding record:", error);
    res.status(500).json({ error: "Failed to add record" });
  }
});

// ✏️ Edit Record
app.post("/edit-record", validateMedicalRecord, (req, res) => {
  const { patientName, diagnosis, treatment, date, patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ error: "Patient ID required for editing" });
  }

  try {
    const existingRecord = medicalChain.getLatestPatientRecord(patientId);
    if (!existingRecord) {
      return res.status(404).json({ error: "Patient record not found" });
    }

    const index = medicalChain.chain.length;
    const timestamp = new Date().toISOString();
    const data = { 
      patientId, 
      patientName, 
      diagnosis, 
      treatment, 
      date, 
      deleted: false,
      type: "update",
      previousHash: existingRecord.hash,
      recordId: medicalChain.generateRecordId()
    };
    
    const newBlock = new Block(index, timestamp, data);
    medicalChain.addBlock(newBlock);

    console.log("✏️ Edited record for:", patientName);
    res.json({ 
      success: true,
      message: "Record updated successfully!",
      blockHash: newBlock.hash
    });
  } catch (error) {
    console.error("Error editing record:", error);
    res.status(500).json({ error: "Failed to update record" });
  }
});

// 🗑️ Delete Record
app.post("/delete-record", (req, res) => {
  const { patientId } = req.body;

  if (!patientId) {
    return res.status(400).json({ error: "Patient ID required" });
  }

  try {
    const existingRecord = medicalChain.getLatestPatientRecord(patientId);
    if (!existingRecord) {
      return res.status(404).json({ error: "Patient record not found" });
    }

    const index = medicalChain.chain.length;
    const timestamp = new Date().toISOString();
    const data = { 
      patientId: existingRecord.data.patientId,
      patientName: existingRecord.data.patientName,
      deleted: true,
      type: "delete",
      previousHash: existingRecord.hash,
      recordId: medicalChain.generateRecordId()
    };
    
    const newBlock = new Block(index, timestamp, data);
    medicalChain.addBlock(newBlock);

    console.log("🗑️ Deleted record for:", existingRecord.data.patientName);
    res.json({ 
      success: true,
      message: "Record deleted successfully!",
      blockHash: newBlock.hash
    });
  } catch (error) {
    console.error("Error deleting record:", error);
    res.status(500).json({ error: "Failed to delete record" });
  }
});

// 📋 Get All Active Records
app.get("/records", (req, res) => {
  try {
    const activeRecords = Array.from(medicalChain.patientRecords.values())
      .map(block => ({
        ...block.data,
        hash: block.hash,
        timestamp: block.timestamp,
        index: block.index
      }));
    
    res.json(activeRecords);
  } catch (error) {
    console.error("Error fetching records:", error);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// 🔍 Get Patient History
app.get("/patient-history/:patientId", (req, res) => {
  const { patientId } = req.params;
  
  try {
    const history = medicalChain.getPatientHistory(patientId)
      .map(block => ({
        ...block.data,
        hash: block.hash,
        timestamp: block.timestamp,
        index: block.index
      }));
    
    res.json(history);
  } catch (error) {
    console.error("Error fetching patient history:", error);
    res.status(500).json({ error: "Failed to fetch patient history" });
  }
});

// 🔗 Validate Blockchain
app.get("/validate-chain", (req, res) => {
  const isValid = medicalChain.isChainValid();
  res.json({ 
    valid: isValid,
    chainLength: medicalChain.chain.length,
    patientCount: medicalChain.patientRecords.size
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    chainLength: medicalChain.chain.length,
    difficulty: medicalChain.difficulty
  });
});

// Get blockchain info
app.get("/blockchain-info", (req, res) => {
  res.json({
    chainLength: medicalChain.chain.length,
    difficulty: medicalChain.difficulty,
    patientCount: medicalChain.patientRecords.size,
    isValid: medicalChain.isChainValid(),
    latestBlock: medicalChain.getLatestBlock()
  });
});

// FIXED: Serve frontend for all routes - Use proper Express syntax
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// FIXED: This is the problematic line - use a different approach
// Instead of app.get("/*"), we'll handle 404s by serving index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Use Render's PORT environment variable
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Secure Blockchain Medical Records Server running on port http://localhost:3000`);
  console.log("⛏️  Mining difficulty:", medicalChain.difficulty);
  console.log("🔗 Genesis block hash:", medicalChain.chain[0].hash);
  console.log("🌐 Server is ready for production!");
});
