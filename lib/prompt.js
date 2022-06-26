const inquirer = require('inquirer');

const connection = require('./connection');

const { viewDepartment, addDept } = require('./department');

const { viewEmployees, addEmployee } = require('./employee');

const { viewRoles, addRole, updateRole } = require('./role');

//inquirer prompts
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
                    'Update an employee',
                    // 'Update an employee manager',
                    // "View employees by department",
                    // 'Delete a department',
                    // 'Delete a role',
                    // 'Delete an employee',
                    // 'View department budgets',
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
            addDept();
        }
        else if(answer.choices === "Add a role"){
            addRole();
        }
        else if(answer.choices === "Add a new employee"){
            addEmployee();
        }
        else if(answer.choices === "Update an employee"){
            updateRole();
        }
        else if(answer.choices === "Exit"){
            connection.end();
        }
        
        
    })
    
}

module.exports = {
    promptUser
};