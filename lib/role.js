const inquirer = require('inquirer');

const connection = require('./connection');

const { promptUser } = require('../server');

//view all roles
const viewRoles = ()=>{
    console.log('Here are all the roles')
    connection.promise().query(`SELECT role.id, role.title, department.name AS department
                                    FROM role
                                    INNER JOIN department ON role.department_id = department.id`, (err,res) => {
        if (err) throw err;
        console.table(res);
        promptUser();
    })
};

//add role
const addRole = () => {
    //Get Departments from db
    connection.query('SELECT role.id, name, department_id, department.id FROM role RIGHT JOIN department ON role.department_id = department.id ORDER BY title ASC;', async (err, res) => {
        if (err) throw err;
        //Prompt for what role to add
        const data = await inquirer.prompt(
            [
                {
                    type: 'input',
                    name: 'addRole',
                    message: 'What role would you like too add?',
                }, 
                {
                    type: 'input',
                    name: 'addSalary',
                    message: 'What is this roles salary?',
                    validate: (value) => {
                        const pass = value.match(/^[0-9]*$/);
                        return pass ? true : 'Please enter a number'
                    }
                },
                {
                    type: 'list',
                    name: 'addRoleDept',
                    message: 'Which department is this for?',
                    choices: () => {
                        let roles = res.map(dept => dept.name);
                        roles = [...new Set(roles)];
                        return roles;
                    }
                }
            ]
        );
        //Filter the dept name to get dept_id
        let deptID;
        res.filter(dept => {
            if (dept.name === data.addRoleDept) {
                deptID = dept.id;
            }
        });
        //Add the role that the user has specified
        connection.query('INSERT INTO role SET ?', 
            {
                title: data.addRole,
                salary: data.addSalary,
                department_id: deptID
            },
            (err, res) => {
                if (err) throw err;
                //Success message
                console.log(`\n${data.addRole} has been added to roles\n`);
                promptUser();
            }
        );
    });
};

//update employee
const updateRole = () => {
    connection.query('SELECT role.id, role.title, CONCAT(employee.first_name," ", employee.last_name) AS employee, employee.id AS employee_id, CONCAT(employee2.first_name, " ", employee2.last_name) AS manager, employee.manager_id FROM role LEFT JOIN employee on employee.role_id = role.id LEFT JOIN employee AS employee2 ON employee.manager_id = employee2.id;', async (err,res) => {
        if (err) throw err;
        
        const data = await inquirer.prompt(
            [
                {
                    type: 'list',
                    name: 'empChoice',
                    message: 'Whose role would you like to update',
                    choices: () => {
                        const employees = [];
                        res.filter(emp => {
                            if (typeof emp.employee === 'string'){ 
                                employees.push(emp.employee);
                            }
                        });
                        return employees;
                    }
                },
                {
                    type: 'list',
                    name: 'roleChoice',
                    message: 'What is their new role?',
                    choices: () => {
                        let result = res.map(role => role.title);
                        let noMultiples = [...new Set(result)];
                        return noMultiples;
                    }
                },
                {
                    type: 'confirm',
                    name: 'updateMGR',
                    message: 'Would you like to change or remove their manager?'
                },
                {
                    type: 'list',
                    name: 'mgrChoice',
                    message: 'Please choose their manager',
                    when: answers => answers.updateMGR,
                    choices: () => {
                        let managers = ['Remove Manager'];
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
        //Filter role for role id
        let roleID;
        res.filter(role => {
            if (role.title === data.roleChoice) {
                roleID = role.id;
            }
        });
        //Filter employee name for employee id
        let empID;
        res.filter(emp => {
            if (emp.employee === data.empChoice) {
                empID = emp.employee_id;
            }
        });
        //Filter mgr name for mgr id
        let mgrID;
        res.filter(mgr => {
            if (mgr.manager === data.mgrChoice) {
                mgrID = mgr.manager_id;
            }
        });
        // Update the employees role in the DB
        await connection.query('UPDATE employee SET ? WHERE ?', 
        [
            {
                role_id: roleID,
                manager_id: mgrID
            },
            {
                id: empID
            }
        ],
        (err, res) => {
            if (err) throw err;
            //If mgr removed 
            else if (data.mgrChoice === 'Remove Manager') {
                connection.query('DELETE FROM employee WHERE ?', { manager_id: mgrID }, (err, res) => {
                    if (err) throw err;
                    //Success message
                    console.log(`\n${data.empChoice}'s role has been updated and their manager removed\n`);
                    promptUser();
                });
            }else{
                console.log(`\n${data.empChoice}'s role has been updated\n`);
                promptUser();
            }
        });
    });
};

module.exports = {
    viewRoles,
    addRole,
    updateRole

}