const express = require('express');
const app = express();
const port = 4000;

const mysql = require('mysql2');

// Express application
app.use(express.json());

// Connecting to the database
const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "storedb",
}).promise();

// Route to get all products
app.get('/api/products', async (req, res) => {
    try {
        const [data] = await pool.execute("SELECT * from products");
        res.status(200).json(data);
    } catch (err) {
        // Return Internal Server Error (500)
        res.status(500).json({ message: err.message });
    }
});

// Route to get a product by ID
app.get('/api/products/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const [data] = await pool.execute("SELECT * from products WHERE id=?", [id]);
        const rows = data;

        if (rows.length === 0) {
            // Return Not Found (404)
            res.status(404).json();
        } else {
            res.status(200).json(rows[0]);
        }
    } catch (err) {
        // Return Internal Server Error (500)
        res.status(500).json({ message: err.message });
    }
});

// Validate product function
function isValidProduct(product) {
    const errors = {};

    if (!product.name) {
        errors.name = "The name is required";
    }

    if (!product.brand) {
        errors.brand = "The brand is required";
    }

    if (!product.category) {
        errors.category = "The category is required";
    }

    if (!product.price || isNaN(product.price)) {
        errors.price = "The price is not valid";
    }

    if (!product.description) {
        errors.description = "The description is required";
    }

    const hasErrors = Object.keys(errors).length > 0;
    return { hasErrors, errors };
}

// Route to create a new product
app.post('/api/products', async (req, res) => {
    const product = req.body;

    try {
        const { hasErrors, errors } = isValidProduct(product);
        if (hasErrors) {
            res.status(400).json(errors);
            return;
        }

        // Insert new product into the database
        const created_at = new Date().toISOString();
        const sql = 'INSERT INTO products (name, brand, category, price, description, created_at) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [product.name, product.brand, product.category, product.price, product.description, created_at];

        const [data] = await pool.execute(sql, values);
        const id = data.insertId;

        const [newProduct] = await pool.execute("SELECT * FROM products WHERE id=?", [id]);
        res.status(200).json(newProduct[0]);
    } catch (err) {
        // Return Internal Server Error (500)
        res.status(500).json({ message: err.message });
    }
});

// Route to update a product by ID
app.put('/api/products/:id', async (req, res) => {
    const product = req.body;
    const id = req.params.id;

    try {
        const { hasErrors, errors } = isValidProduct(product);
        if (hasErrors) {
            res.status(400).json(errors);
            return;
        }

        // Update product in the database
        const sql = 'UPDATE products SET name=?, brand=?, category=?, price=?, description=? WHERE id=?';
        const values = [product.name, product.brand, product.category, product.price, product.description, id];

        await pool.execute(sql, values);
        const [updatedProduct] = await pool.execute("SELECT * FROM products WHERE id=?", [id]);

        res.status(200).json(updatedProduct[0]);
    } catch (err) {
        // Return Internal Server Error (500)
        res.status(500).json({ message: err.message });
    }
});

// Route to delete a product by ID
app.delete('/api/products/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await pool.execute("DELETE FROM products WHERE id=?", [id]);
        res.status(200).json({ message: `Product with ID ${id} deleted successfully` });
    } catch (err) {
        // Return Internal Server Error (500)
        res.status(500).json({ message: err.message });
    }
});

app.listen(port, () => {
    console.log("Server listening on port " + port);
});
