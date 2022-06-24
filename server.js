const mysql = require('mysql2');

const inquirer = require('inquirer'); 

require('dotenv').config();

const connection = mysql.createConnection({
    host: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'employee_db'
});

connection.connect(err => {
    if (err) throw err;
    console.log('connected as id ' + connection.threadId);
    promptUser();
});

const promptUser = () => {
    inquirer.prompt ([
        {
            type: 'list',
            name: 'choices', 
            message: 'What would you like to do?',
            choices: ['View all departments', 
                    'View all roles', 
                    'View all employees', 
                    'Add a department', 
                    'Add a role', 
                    'Add an employee', 
                    'Update an employee role',
                    'Update an employee manager',
                    "View employees by department",
                    'Delete a department',
                    'Delete a role',
                    'Delete an employee',
                    'View department budgets',
                    'No Action']
        }
    ])
}

