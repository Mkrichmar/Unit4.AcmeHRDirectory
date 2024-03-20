require('dotenv').config();
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || `postgres://localhost/${process.env.DB_NAME}`);
const express = require('express');
const app = express();

app.use(require('morgan')('dev'));
app.use(express.json());

app.get('/api/departments', async(req, res, next) => {
    try {
        const SQL = `
        SELECT * from departments;
        `;
        const response = await client.query(SQL);
        res.send(response.rows)
    }
    catch(error) {
        next(error)
    }
});

app.get('/api/employees', async(req, res, next) => {
    try {
        const SQL = `
        SELECT * from employees;
        `;
        const response = await client.query(SQL);
        res.send(response.rows)
    }
    catch(error) {
        next(error)
    }
});

app.post('/api/employees', async(req, res, next) => {
    try {
        const SQL =`
        INSERT INTO employees(name, department_id)
        VALUES($1,$2)
        RETURNING *
        `;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.department_id
        ]);
        res.send(response.rows[0])
    }
    catch(error) {
        next(error)
    }
});

app.put('/api/employees/:id', async(req, res, next) => {
    try {
        const SQL = `
        UPDATE employees
        SET name=$1, created_at= now(), updated_at= now(), department_id=$2
        WHERE id=$3 RETURNING *

        `;
        const response = await client.query(SQL, [
            req.body.name,
            req.body.department_id,
            req.params.id,
        ]);
        res.send(response.rows[0])
    } catch(error) {
        next(error)
    }
});

app.delete('/api/employees/:id', async(req, res, next) => {
    try {
        const SQL = `
        DELETE FROM employees
        WHERE id = $1
        `;

        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204)
    } catch(error) {
        next(error)
    }
});

const init = async () => {
    await client.connect()
    console.log('connected to database');

    let SQL = /*SQL*/`
    DROP TABLE IF EXISTS employees;
    DROP TABLE IF EXISTS departments;

    CREATE TABLE departments(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL
    );

    CREATE TABLE employees(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now(),
        department_id INTEGER REFERENCES departments(id) NOT NULL
    ) ;
    `;

    
    await client.query(SQL);
    console.log('tables created');

    SQL = `

    INSERT INTO departments(name) VALUES('IT');
    INSERT INTO departments(name) VALUES('Backend');
    INSERT INTO departments(name) VALUES('Frontend');
    INSERT INTO employees(name, department_id) VALUES('Tom Hagan', (SELECT id FROM departments WHERE name='IT'));
    INSERT INTO employees(name, department_id) VALUES('Michael Corleone', (SELECT id FROM departments WHERE name='Backend'));
    INSERT INTO employees(name, department_id) VALUES('Sonny Corleone', (SELECT id FROM departments WHERE name='Frontend'));
    `;

    await client.query(SQL);
    console.log('data seeded');

    const port = process.env.PORT || 3000
    app.listen(port, () => console.log(`listening on port ${port}`))
};

app.use((err, req, res, next) => {
    res.status(500).send(err.message);
})

init();