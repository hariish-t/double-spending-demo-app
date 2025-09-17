// WalletContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import * as Crypto from "expo-crypto";
import { blockchain, createTransaction } from "../blockchain";
import { saveWallet, loadWallet, clearWallet } from "../storage";
import { v4 as uuidv4 } from "uuid"; // npm install uuid

// Create Context
const WalletContext = createContext(null);

// Generate a pseudo wallet address
const generateAddress = async () => {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    Date.now().toString() + Math.random().toString()
  );
  return "0x" + hash.slice(0, 16); // short readable address
};

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState({
    address: "",
    balance: 0,
    transactions: [],
  });

  // Load or initialize wallet
  useEffect(() => {
    const initWallet = async () => {
      const stored = await loadWallet();
      if (stored) {
        console.log("[Wallet] Loaded from storage");
        syncWithBlockchain(stored.address);
      } else {
        const newAddr = await generateAddress();
        console.log("[Wallet] Created new wallet:", newAddr);
        syncWithBlockchain(newAddr);
      }
    };
    initWallet();
  }, []);

  /**
   * Sync UI wallet with blockchain
   */
  const syncWithBlockchain = (address) => {
    const balance = blockchain.getBalanceOfAddress(address);
    const txs = blockchain.getTransactionsOfAddress(address);
    const updated = { address, balance, transactions: txs };
    setWallet(updated);
    saveWallet(updated);
  };

  /**
   * Send a transaction
   */
  const sendTransaction = async (to, amount, isOnline = true) => {
    if (!to) return { error: "Recipient required" };
    if (amount <= 0) return { error: "Amount must be positive" };
    if (amount > wallet.balance) return { error: "Insufficient balance" };

    const tx = createTransaction({
      from: wallet.address,
      to,
      amount,
    });
    tx.id = uuidv4();
    tx.status = isOnline ? "pending" : "pending-offline";

    await blockchain.addTransaction(tx);

    if (isOnline) {
      const mined = await blockchain.minePendingTransactions(wallet.address);
      if (!mined) return { error: "No transactions to mine" };
    }

    syncWithBlockchain(wallet.address);
    return tx;
  };

  /**
   * Resolve an offline transaction
   */
  const resolveOfflineTransaction = async (txId, success = false) => {
    if (success) {
      await blockchain.minePendingTransactions(wallet.address);
    } else {
      blockchain.resolveOfflineTransaction(txId);
    }
    syncWithBlockchain(wallet.address);
  };

  /**
   * Reset wallet + blockchain
   */
  const resetWallet = async () => {
    await clearWallet();
    const newAddr = await generateAddress();
    syncWithBlockchain(newAddr);
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        sendTransaction,
        resolveOfflineTransaction,
        resetWallet,
        syncWithBlockchain,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Hook for easy usage
export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
};
