const SHA256 = require("crypto-js/sha256");

class Block {
  constructor(index, timestamp, data, previousHash = "", nonce = 0) {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = nonce;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return SHA256(
      this.index +
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.data) +
      this.nonce
    ).toString();
  }

  mineBlock(difficulty) {
    console.log(`⛏️ Mining block ${this.index}...`);
    while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`✅ Block mined: ${this.hash}`);
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2; // Reduced for faster mining
    this.patientRecords = new Map();
  }

  createGenesisBlock() {
    return new Block(0, new Date().toISOString(), { 
      message: "Genesis Block",
      type: "genesis"
    }, "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    
    // Update patient records index
    if (newBlock.data.patientId && !newBlock.data.deleted) {
      this.patientRecords.set(newBlock.data.patientId, newBlock);
    } else if (newBlock.data.patientId && newBlock.data.deleted) {
      this.patientRecords.delete(newBlock.data.patientId);
    }
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        console.log(`❌ Invalid hash at block ${i}`);
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log(`❌ Invalid previous hash at block ${i}`);
        return false;
      }
    }
    return true;
  }

  getPatientHistory(patientId) {
    return this.chain.filter(block => 
      block.data.patientId === patientId && block.index !== 0
    );
  }

  getLatestPatientRecord(patientId) {
    return this.patientRecords.get(patientId);
  }

  // Generate unique patient ID without uuid module
  generatePatientId(patientName) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    const namePart = patientName.replace(/\s+/g, '').toLowerCase().substring(0, 8);
    return `${namePart}_${timestamp}_${random}`.substring(0, 30);
  }

  // Generate record ID without uuid module
  generateRecordId() {
    return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}

module.exports = { Block, Blockchain };