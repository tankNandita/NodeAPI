const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
}).promise();

app.get('/api/products', async (req, res) => {
    try {
        const [data] = await pool.execute("SELECT * from products");
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/products/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [data] = await pool.execute("SELECT * from products WHERE id=?", [id]);
        if (data.length === 0) {
            res.status(404).json();
        } else {
            res.status(200).json(data[0]);
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

function isValidProduct(product) {
    const errors = {};
    if (!product.name) errors.name = "The name is required";
    if (!product.brand) errors.brand = "The brand is required";
    if (!product.category) errors.category = "The category is required";
    if (!product.price || isNaN(product.price)) errors.price = "The price is not valid";
    if (!product.description) errors.description = "The description is required";

    const hasErrors = Object.keys(errors).length > 0;
    return { hasErrors, errors };
}

app.post('/api/products', async (req, res) => {
    const product = req.body;
    try {
        const { hasErrors, errors } = isValidProduct(product);
        if (hasErrors) {
            res.status(400).json(errors);
            return;
        }
        const created_at = new Date().toISOString();
        const sql = 'INSERT INTO products (name, brand, category, price, description, created_at) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [product.name, product.brand, product.category, product.price, product.description, created_at];

        const [data] = await pool.execute(sql, values);
        const id = data.insertId;
        const [newProduct] = await pool.execute("SELECT * FROM products WHERE id=?", [id]);
        res.status(200).json(newProduct[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const product = req.body;
    const id = req.params.id;
    try {
        const { hasErrors, errors } = isValidProduct(product);
        if (hasErrors) {
            res.status(400).json(errors);
            return;
        }
        const sql = 'UPDATE products SET name=?, brand=?, category=?, price=?, description=? WHERE id=?';
        const values = [product.name, product.brand, product.category, product.price, product.description, id];

        await pool.execute(sql, values);
        const [updatedProduct] = await pool.execute("SELECT * FROM products WHERE id=?", [id]);
        res.status(200).json(updatedProduct[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await pool.execute("DELETE FROM products WHERE id=?", [id]);
        res.status(200).json({ message: `Product with ID ${id} deleted successfully` });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const port = 4000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

module.exports = app;
