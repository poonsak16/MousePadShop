require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const port = process.env.PORT || 3035;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+07:00"
});

// ตรวจสอบการเชื่อมต่อ
(async function testMySQL() {
    try {
        const conn = await pool.getConnection();
        console.log('Connected to MySQL: ', process.env.DB_NAME);
        conn.release();
    } catch (err) {
        console.error('MySQL Failed: ', err);
        process.exit(1);
    }
})();

// 1. GET: ดึงข้อมูล & Search
app.get('/api/products', async (req, res) => {
    try {
        const { q } = req.query;
        let query = 'SELECT * FROM products';
        let params = [];
        
        if (q) {
            query += ' WHERE name LIKE ? OR category LIKE ? OR productCode LIKE ?';
            const searchPattern = `%${q}%`;
            params = [searchPattern, searchPattern, searchPattern];
        }
        query += ' ORDER BY lastUpdate DESC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (e) {
        console.error('Products Error: ', e.message);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// 2. POST: เพิ่มสินค้า (รองรับ price แล้ว)
app.post('/api/products', async (req, res) => {
    try {
        const { name, stock, category, location, image, status, brand, sizes, productCode, orderName, price } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const [rs] = await pool.query(
            `INSERT INTO products (name, stock, category, location, image, status, brand, sizes, productCode, orderName, price, lastUpdate) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [name, stock || 0, category || null, location || null, image || null, status || 'Active', brand || null, sizes || null, productCode || null, orderName || null, price || 0]
        );
        return res.status(201).json({ success: true, productId: rs.insertId });
    } catch (e) {
        console.error('Create Error: ', e);
        return res.status(500).json({ error: 'Failed to create product' });
    }
});

// 3. PUT: แก้ไขสินค้า (รองรับ price แล้ว)
app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, stock, category, location, image, status, brand, sizes, productCode, orderName, price } = req.body;
        
        if (!name) return res.status(400).json({ error: 'Missing name' });

        const [result] = await pool.query(
            `UPDATE products SET name=?, stock=?, category=?, location=?, image=?, status=?, brand=?, sizes=?, productCode=?, orderName=?, price=?, lastUpdate=NOW() WHERE id=?`,
            [name, stock || 0, category, location, image, status, brand, sizes, productCode, orderName, price || 0, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true, message: 'Updated successfully' });
    } catch (err) {
        console.error('Update Error: ', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// 4. DELETE: ลบสินค้า
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Delete Error: ', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// 5. POST: ระบบสมัครสมาชิก (Register)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    await pool.query(query, [username, password]);
    
    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (err) {
    console.error('Register Error: ', err);
    res.status(500).json({ error: 'ชื่อผู้ใช้นี้อาจถูกใช้งานแล้ว หรือเกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

// 6. POST: ระบบเข้าสู่ระบบ (Login)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    const [results] = await pool.query(query, [username, password]);

    if (results.length > 0) {
      res.json({ message: 'เข้าสู่ระบบสำเร็จ', user: results[0] });
    } else {
      res.status(401).json({ error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
    }
  } catch (err) {
    console.error('Login Error: ', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
  }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`API running on port ${port}`);
});