// blockchain.js
// Core Blockchain Simulation for ChainWallet
// Handles transaction validation, block creation, double spending prevention, and syncing

import * as Crypto from "expo-crypto";
import { v4 as uuidv4 } from "uuid"; // install: npm install uuid

// Toggle debugging logs
const DEBUG = true;

/**
 * Utility: Generate SHA256 hash
 */
const sha256 = async (data) => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    JSON.stringify(data)
  );
};

/**
 * Transaction Factory
 */
export const createTransaction = ({ from, to, amount }) => {
  return {
    id: uuidv4(),
    from,
    to,
    amount,
    status: "pending",
    timestamp: new Date().toISOString(),
  };
};

/**
 * Blockchain Class
 */
class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = 2; // demo PoW difficulty
    this.miningReward = 10;

    this.createGenesisBlock();
  }

  /**
   * Create the first block (Genesis)
   */
  async createGenesisBlock() {
    const genesisTx = {
      id: "0",
      from: "system",
      to: "network",
      amount: 0,
      status: "confirmed",
      timestamp: new Date().toISOString(),
    };
    const block = await this.createBlock([genesisTx], "0");
    this.chain.push(block);
    if (DEBUG) console.log("[Blockchain] Genesis block created.");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Block Creation
   */
  async createBlock(transactions, previousHash) {
    const block = {
      index: this.chain.length,
      timestamp: new Date().toISOString(),
      transactions,
      previousHash,
      nonce: 0,
    };

    block.hash = await this.proofOfWork(block);
    return block;
  }

  /**
   * Proof of Work (demo)
   */
  async proofOfWork(block) {
    let hash;
    do {
      block.nonce++;
      hash = await sha256({
        index: block.index,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        transactions: block.transactions,
        nonce: block.nonce,
      });
    } while (!hash.startsWith("0".repeat(this.difficulty)));

    return hash;
  }

  /**
   * Add a new transaction to the pool
   */
  async addTransaction(tx) {
    if (!tx.from || !tx.to) throw new Error("Transaction must include from and to.");
    if (tx.from === tx.to) throw new Error("Sender and receiver cannot be the same.");
    if (tx.amount <= 0) throw new Error("Transaction amount must be positive.");

    // Check balance (basic prevention)
    if (this.getBalanceOfAddress(tx.from) < tx.amount) {
      tx.status = "failed";
      if (DEBUG) console.warn("[Blockchain] Transaction failed: insufficient balance.");
      return tx;
    }

    // Check for double spending in pool
    const doubleSpend = this.pendingTransactions.find(
      (t) => t.from === tx.from && t.amount === tx.amount && t.status === "pending"
    );
    if (doubleSpend) {
      tx.status = "double-spent";
      if (DEBUG) console.warn("[Blockchain] Double spend detected in pending pool.");
    }

    this.pendingTransactions.push(tx);
    if (DEBUG) console.log("[Blockchain] Transaction added:", tx);
    return tx;
  }

  /**
   * Mine pending transactions
   */
  async minePendingTransactions(minerAddress) {
    if (this.pendingTransactions.length === 0) {
      if (DEBUG) console.log("[Blockchain] No transactions to mine.");
      return null;
    }

    // Mark all as confirmed before mining
    this.pendingTransactions = this.pendingTransactions.map((tx) => ({
      ...tx,
      status: tx.status === "pending" ? "confirmed" : tx.status,
    }));

    const block = await this.createBlock(this.pendingTransactions, this.getLatestBlock().hash);
    this.chain.push(block);

    // Reward miner
    this.pendingTransactions = [
      createTransaction({
        from: "system",
        to: minerAddress,
        amount: this.miningReward,
      }),
    ];
    this.pendingTransactions[0].status = "confirmed";

    if (DEBUG) console.log("[Blockchain] Block mined:", block.index);
    return block;
  }

  /**
   * Check blockchain validity
   */
  async isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const prev = this.chain[i - 1];

      const checkHash = await sha256({
        index: current.index,
        previousHash: current.previousHash,
        timestamp: current.timestamp,
        transactions: current.transactions,
        nonce: current.nonce,
      });

      if (current.hash !== checkHash) return false;
      if (current.previousHash !== prev.hash) return false;
    }
    return true;
  }

  /**
   * Resolve offline conflicts
   */
  resolveOfflineTransaction(txId) {
    this.chain.forEach((block) => {
      block.transactions.forEach((tx) => {
        if (tx.id === txId && tx.status === "pending") {
          tx.status = "double-spent";
        }
      });
    });
    if (DEBUG) console.warn("[Blockchain] Offline conflict resolved for:", txId);
  }

  /**
   * Get balance of an address
   */
  getBalanceOfAddress(address) {
    let balance = 0;
    this.chain.forEach((block) => {
      block.transactions.forEach((tx) => {
        if (tx.from === address) balance -= tx.amount;
        if (tx.to === address) balance += tx.amount;
      });
    });
    return balance;
  }

  /**
   * Get transactions of an address
   */
  getTransactionsOfAddress(address) {
    const history = [];
    this.chain.forEach((block) => {
      block.transactions.forEach((tx) => {
        if (tx.from === address || tx.to === address) {
          history.push(tx);
        }
      });
    });
    return history;
  }

  /**
   * Utility helpers
   */
  getChain() {
    return JSON.parse(JSON.stringify(this.chain));
  }

  getPendingTransactions() {
    return [...this.pendingTransactions];
  }

  getBlockByIndex(index) {
    return this.chain.find((b) => b.index === index) || null;
  }

  findTransactionById(txId) {
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.id === txId) return tx;
      }
    }
    return null;
  }
}

// Singleton instance
export const blockchain = new Blockchain();
