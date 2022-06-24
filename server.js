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
            choices: ['View departments', 
                    'View roles', 
                    'View employees', 
                    'Add a department', 
                    'Add a role', 
                    'Add a new employee', 
                    'Update an employee role',
                    'Update an employee manager',
                    "View employees by department",
                    'Delete a department',
                    'Delete a role',
                    'Delete an employee',
                    'View department budgets',
                    'Exit']
        }
    ])
    .then(function(answer){
      if(answer.choices === "View departments"){
        viewDepartment();
      }
      else if(answer.choices === "View roles"){
        viewRoles();
      }
      else if(answer.choices === "View employees"){
        viewEmployees();
      }
      else if(answer.choices === "Add a department"){
        addDepartment();
      }
      else if(answer.choices === "Add a role"){
        addRole();
      }
      else if(answer.choices === "Add a new employee"){
        addEmployee();
      }
      else if(answer.choices === "Update an employee role'"){
        updateRole();
      }
      if(answer.choices === "Exit"){
        connection.end();
      }
      
      
    })
    
}

viewDepartment = ()=>{
  console.log('Here are all of the departments')
  connection.promise().query('SELECT department.id AS id, department.name AS department FROM department', (err,res) => {
    if (err) throw err;
    console.table(res);
    promptUser();
  })
};
