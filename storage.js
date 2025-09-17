import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";

const STORAGE_KEYS = {
  WALLET: "CHAIN_WALLET_DATA",
  VERSION: "CHAIN_WALLET_VERSION",
  BLOCKCHAIN: "CHAIN_BLOCKCHAIN_DATA",
};

const STORAGE_VERSION = 1;
const SECRET_KEY = "super-secret-chainwallet-key"; // ⚠️ never hardcode in production

/**
 * Encrypt JSON object to string
 */
const encrypt = (data) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  } catch (error) {
    console.error("[Storage] Encryption failed:", error);
    return null;
  }
};

/**
 * Decrypt string back to JSON
 */
const decrypt = (cipherText) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("[Storage] Decryption failed:", error);
    return null;
  }
};

/**
 * Save wallet securely
 */
export const saveWallet = async (wallet) => {
  try {
    const encrypted = encrypt(wallet);
    if (!encrypted) throw new Error("Wallet encryption failed");

    await AsyncStorage.multiSet([
      [STORAGE_KEYS.WALLET, encrypted],
      [STORAGE_KEYS.VERSION, STORAGE_VERSION.toString()],
    ]);

    console.log("[Storage] Wallet saved securely.");
  } catch (error) {
    console.error("[Storage] Error saving wallet:", error);
  }
};

/**
 * Load wallet securely
 */
export const loadWallet = async () => {
  try {
    const values = await AsyncStorage.multiGet([
      STORAGE_KEYS.WALLET,
      STORAGE_KEYS.VERSION,
    ]);

    const walletCipher = values.find(([key]) => key === STORAGE_KEYS.WALLET)?.[1];
    const versionStr = values.find(([key]) => key === STORAGE_KEYS.VERSION)?.[1];

    if (!walletCipher) {
      console.log("[Storage] No wallet found.");
      return null;
    }

    const wallet = decrypt(walletCipher);
    const version = versionStr ? parseInt(versionStr, 10) : 0;

    if (version !== STORAGE_VERSION) {
      console.warn(
        `[Storage] Wallet version mismatch (found v${version}, expected v${STORAGE_VERSION}). Running migration...`
      );
      // TODO: add migration logic
    }

    console.log("[Storage] Wallet loaded successfully.");
    return wallet;
  } catch (error) {
    console.error("[Storage] Error loading wallet:", error);
    return null;
  }
};

/**
 * Save blockchain securely
 */
export const saveBlockchain = async (chain) => {
  try {
    const encrypted = encrypt(chain);
    if (!encrypted) throw new Error("Blockchain encryption failed");

    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKCHAIN, encrypted);
    console.log("[Storage] Blockchain saved securely.");
  } catch (error) {
    console.error("[Storage] Error saving blockchain:", error);
  }
};

/**
 * Load blockchain securely
 */
export const loadBlockchain = async () => {
  try {
    const cipher = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKCHAIN);
    if (!cipher) {
      console.log("[Storage] No blockchain found.");
      return null;
    }

    const chain = decrypt(cipher);
    console.log("[Storage] Blockchain loaded successfully.");
    return chain;
  } catch (error) {
    console.error("[Storage] Error loading blockchain:", error);
    return null;
  }
};

/**
 * Clear everything
 */
export const clearWallet = async () => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.WALLET,
      STORAGE_KEYS.VERSION,
      STORAGE_KEYS.BLOCKCHAIN,
    ]);
    console.log("[Storage] Wallet & Blockchain cleared.");
  } catch (error) {
    console.error("[Storage] Error clearing wallet:", error);
  }
};
