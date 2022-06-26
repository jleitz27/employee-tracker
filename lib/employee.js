const inquirer = require('inquirer');

const connection = require('./connection');

const app = require('./prompt');

//view all employess
const viewEmployees = ()=>{
    console.log('Here are all the employess')
    connection.promise().query(`SELECT employee.id, 
                                employee.first_name, 
                                employee.last_name, 
                                role.title, 
                                department.name AS department,
                                role.salary, 
                                CONCAT (manager.first_name, " ", manager.last_name) AS manager
                            FROM employee
                                LEFT JOIN role ON employee.role_id = role.id
                                LEFT JOIN department ON role.department_id = department.id
                                LEFT JOIN employee manager ON employee.manager_id = manager.id`, 
                                (err,res) => {
        if (err) throw err;
        console.table(res);
        app.promptUser();
    })
};

//add employee
const addEmployee = () => {
    connection.query('SELECT role.id, role.title, CONCAT(employee2.first_name," ", employee2.last_name) AS manager, employee.manager_id FROM role LEFT JOIN employee on employee.role_id = role.id LEFT JOIN employee AS employee2 ON employee.manager_id = employee2.id;', async (err, res) => {
        if (err) throw err;
        //Prompt for employee data to add
        const data = await inquirer.prompt(
            [
                {
                    type: 'input',
                    name: 'addFirst',
                    message: 'What is their first name?',
                },
                {
                    type: 'input',
                    name: 'addLast',
                    message: 'What is their last name?',
                },
                {
                    type: 'list',
                    name: 'addRole',
                    message: 'What is their role?',
                    choices: () => {
                        let roles = res.map(role => role.title);
                        roles = [...new Set(roles)];
                        return roles;
                    }
                    
                },
                {
                    type: 'confirm',
                    name: 'hasMGR',
                    message: 'Will this employee be managed?'
                },
                {
                    type: 'list',
                    name: 'manager',
                    message: 'Please choose their manager',
                    when: answers => answers.hasMGR,
                    choices: () => {
                        let managers = [];
                        res.filter(role => {
                            if (typeof role.manager === 'string') {
                                managers.push(role.manager)
                            }
                        });
                        managers = [...new Set(managers)]
                        return managers;
                    }
                }
            ]
        );
        //Filter the chosen role to get its role_id
        let roleID;
        res.filter(role => {
            if(role.title === data.addRole){
                roleID = role.id;
            }
        });
        //Filter the chosen manger and assign manager_id
        let managerID;
        res.filter(role => {
            if (role.manager === data.manager){
                managerID = role.manager_id;
            }
        });
        //Add the employee as specified 
        connection.query('INSERT INTO employee SET ?',
            {
                first_name: data.addFirst,
                last_name: data.addLast,
                role_id: roleID,
                manager_id: managerID

            },
            (err, res) => {
                if (err) throw err;
                //Success message
                console.log(`\n${data.addFirst} ${data.addLast} has been added as an employee\n`);
                app.promptUser();
            }
        );
    });
};

module.exports = {
    viewEmployees,
    addEmployee
}