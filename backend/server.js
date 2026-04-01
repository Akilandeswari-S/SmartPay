const express = require('express');
const sqlite3 = require('./sqlite_mock').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SmartPay Backend Running Successfully 🚀");
});

const db = new sqlite3.Database('file:ledger.db');

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, phone TEXT, name TEXT, email TEXT, dob TEXT, kycStatus TEXT, pin TEXT, onlineBalance INTEGER, offlineBalance INTEGER, publicKey TEXT, linkedBank TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, payerId TEXT, payeeId TEXT, amount INTEGER, nonce TEXT, signature TEXT, timestamp DATETIME, type TEXT)");
  
  // INSERT OR IGNORE: only seeds data once, preserves balances across restarts
  db.run("INSERT OR IGNORE INTO users (id, phone, name, pin, kycStatus, onlineBalance, offlineBalance, publicKey) VALUES ('user_1', '9876543210', 'Alice', '1234', 'VERIFIED', 25000, 2000, 'DUMMY_PUB_KEY_1')");
  db.run("INSERT OR IGNORE INTO users (id, phone, name, pin, kycStatus, onlineBalance, offlineBalance, publicKey) VALUES ('user_2', 'user2phone', 'Bob', '1234', 'VERIFIED', 10000, 1000, 'DUMMY_PUB_KEY_2')");

  // Seed sample transaction history for demo
  db.run("INSERT OR IGNORE INTO transactions (id, payerId, payeeId, amount, type, timestamp) VALUES ('txn_demo_1', 'user_1', 'user_2', 500, 'ONLINE', '2026-03-19T10:30:00')");
  db.run("INSERT OR IGNORE INTO transactions (id, payerId, payeeId, amount, type, timestamp) VALUES ('txn_demo_2', 'user_2', 'user_1', 200, 'ONLINE', '2026-03-19T11:45:00')");
  db.run("INSERT OR IGNORE INTO transactions (id, payerId, payeeId, amount, type, timestamp) VALUES ('txn_demo_3', 'user_1', 'user_2', 100, 'OFFLINE_BLE_SYNC', '2026-03-19T14:20:00')");
  db.run("INSERT OR IGNORE INTO transactions (id, payerId, payeeId, amount, type, timestamp) VALUES ('txn_demo_4', 'user_1', 'user_2', 50, 'SMS_FALLBACK', '2026-03-19T16:00:00')");
  db.run("INSERT OR IGNORE INTO transactions (id, payerId, payeeId, amount, type, timestamp) VALUES ('txn_demo_5', 'user_2', 'user_1', 750, 'ONLINE', '2026-03-18T09:15:00')");
});

// LEVEL 2: AUTH API
app.post('/api/auth/otp', (req, res) => {
  if (req.body.otp === '1234') {
    db.get("SELECT * FROM users WHERE phone = ?", [req.body.phone], (err, row) => {
      if (row) {
        return res.json({ token: 'mock_jwt_token', userId: row.id, isNewUser: false });
      } else {
        return res.json({ token: 'mock_temp_token', isNewUser: true });
      }
    });
  } else {
    res.status(401).json({ error: "Invalid OTP" });
  }
});

// REGISTRATION
app.post('/api/user/register', (req, res) => {
  const { phone, name, email, dob, pin, publicKey } = req.body;
  const userId = 'user_' + Date.now();
  db.run("INSERT INTO users (id, phone, name, email, dob, pin, kycStatus, onlineBalance, offlineBalance, publicKey) VALUES (?, ?, ?, ?, ?, ?, 'VERIFIED', 25000, 2000, ?)",
    [userId, phone, name, email, dob, pin, publicKey || 'DUMMY_PUB_KEY'], 
    (err) => {
      if (err) return res.status(500).json({ error: "Registration Failed" });
      res.json({ success: true, userId, message: "Registered Successfully" });
  });
});

// LEVEL 2: BANK LINK API
app.post('/api/user/link-bank', (req, res) => {
  const { userId, bankName, accountNo } = req.body;
  db.run("UPDATE users SET linkedBank = ? WHERE id = ?", [`${bankName} - ${accountNo}`, userId], (err) => {
    if(err) return res.status(500).json({error: "Failed"});
    res.json({ success: true, message: "Bank Successfully Linked!" });
  });
});

// LEVEL 2: TRANSACTION HISTORY
app.get('/api/history/:userId', (req, res) => {
  db.all("SELECT * FROM transactions WHERE payerId = ? OR payeeId = ? ORDER BY timestamp DESC", [req.params.userId, req.params.userId], (err, rows) => {
    res.json({ history: rows || [] });
  });
});

// LEVEL 3: FETCH BALANCES
app.get('/api/user/wallet/:id', (req, res) => {
  db.get("SELECT onlineBalance, offlineBalance FROM users WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "User not found" });
    res.json(row);
  });
});

app.post('/api/user/verify-pin', (req, res) => {
  const { userId, pin } = req.body;
  db.get("SELECT pin FROM users WHERE id = ?", [userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "User not found" });
    if (row.pin === pin) return res.json({ success: true });
    res.json({ success: false, error: "Incorrect PIN" });
  });
});

// LEVEL 3: SELF TRANSFER (HYBRID WALLET)
app.post('/api/user/wallet/transfer', (req, res) => {
  const { userId, direction, amount } = req.body;
  if (amount <= 0) return res.status(400).json({ error: "Invalid amount" });

  db.get("SELECT onlineBalance, offlineBalance FROM users WHERE id = ?", [userId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "User not found" });

    db.serialize(() => {
      if (direction === 'ONLINE_TO_OFFLINE') {
        if (row.onlineBalance < amount) return res.status(400).json({ error: "Insufficient online balance" });
        db.run("UPDATE users SET onlineBalance = onlineBalance - ?, offlineBalance = offlineBalance + ? WHERE id = ?", [amount, amount, userId]);
      } else if (direction === 'OFFLINE_TO_ONLINE') {
        if (row.offlineBalance < amount) return res.status(400).json({ error: "Insufficient offline balance" });
        db.run("UPDATE users SET offlineBalance = offlineBalance - ?, onlineBalance = onlineBalance + ? WHERE id = ?", [amount, amount, userId]);
      }
      res.json({ success: true, message: `Transferred ₹${amount} successfully.` });
    });
  });
});

// LEVEL 2: ONLINE TRANSFER
app.post('/api/transfer', (req, res) => {
  const { payerId, payeeId, amount } = req.body;
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
  if (payerId === payeeId) return res.status(400).json({ error: "Cannot transfer to yourself" });

  db.get("SELECT onlineBalance FROM users WHERE id = ?", [payerId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Payer not found" });
    if (row.onlineBalance < amount) return res.status(400).json({ error: "Insufficient balance" });

    db.serialize(() => {
      db.run("UPDATE users SET onlineBalance = onlineBalance - ? WHERE id = ?", [amount, payerId]);
      db.run("UPDATE users SET onlineBalance = onlineBalance + ? WHERE id = ?", [amount, payeeId]);
      db.run("INSERT INTO transactions (id, payerId, payeeId, amount, type, timestamp) VALUES (?, ?, ?, ?, ?, ?)", 
             [`txn_${Date.now()}`, payerId, payeeId, amount, 'ONLINE', new Date().toISOString()]);
      res.json({ success: true, message: `Sent ₹${amount} to ${payeeId}` });
    });
  });
});

// LEVEL 3: OFFLINE SYNCHRONIZATION ENDPOINT
app.post('/settle', (req, res) => {
  const { payerId, payeeId, amount, nonce, signature, timestamp } = req.body;
  db.run("UPDATE users SET offlineBalance = offlineBalance - ? WHERE id = ?", [amount, payerId]);
  db.run("UPDATE users SET onlineBalance = onlineBalance + ? WHERE id = ?", [amount, payeeId]);
  db.run("INSERT INTO transactions (id, payerId, payeeId, amount, nonce, signature, timestamp, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
    [`off_${Date.now()}`, payerId, payeeId, amount, nonce, signature, timestamp, 'OFFLINE_BLE_SYNC']);
  res.json({ success: true, message: "Offline sync successful." });
});

// LEVEL 4: PROFILE ENDPOINTS
app.get('/api/user/profile/:id', (req, res) => {
  db.get("SELECT name, email, phone, dob, kycStatus FROM users WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "User not found" });
    res.json(row);
  });
});

app.put('/api/user/profile/:id', (req, res) => {
  const { name, email, dob } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  db.run(
    "UPDATE users SET name = ?, email = ?, dob = ? WHERE id = ?",
    [name, email, dob, req.params.id],
    function(err) {
      if (err) return res.status(500).json({ error: "Failed to update profile" });
      res.json({ success: true, message: "Profile updated successfully" });
    }
  );
});

// USER LOOKUP BY PHONE OR ID
app.get('/api/user/lookup/:query', (req, res) => {
  const q = req.params.query;
  db.get("SELECT id, name, phone FROM users WHERE phone = ? OR id = ?", [q, q], (err, row) => {
    if (err || !row) return res.status(404).json({ found: false });
    res.json({ found: true, id: row.id, name: row.name, phone: row.phone });
  });
});

app.listen(3000, () => console.log('Full Stack Settlement Backend on 3000'));
