const inquirer = require('inquirer');

const connection = require('./connection');

const app = require('./prompt');

//view all roles
const viewRoles = ()=>{
    console.log('Here are all the roles')
    connection.promise().query(`SELECT role.id, role.title, department.name AS department
                                    FROM role
                                    INNER JOIN department ON role.department_id = department.id`, (err,res) => {
        if (err) throw err;
        console.table(res);
        app.promptUser();
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
                app.promptUser();
            }
        );
    });
};

//update employee
const updateRole = () => {
    console.log("I am the best");
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
                }
                ])
                    .then(empChoice => {
                    const employee = empChoice.name;
                    const params = []; 
                    params.push(employee);
            
                    const roleSql = `SELECT * FROM role`;
            
                    connection.promise().query(roleSql, (err, data) => {
                        if (err) throw err; 
            
                        const roles = data.map(({ id, title }) => ({ name: title, value: id }));
                        
                        inquirer.prompt([
                            {
                            type: 'list',
                            name: 'role',
                            message: "What is the employee's new role?",
                            choices: roles
                            }
                        ])
                            .then(roleChoice => {
                            const role = roleChoice.role;
                            params.push(role); 
                            
                            let employee = params[0]
                            params[0] = role
                            params[1] = employee 
                            
            
                            // console.log(params)
            
                            const sql = `UPDATE employee SET role_id = ? WHERE id = ?`;
            
                            connection.query(sql, params, (err, result) => {
                                if (err) throw err;
                                console.log(`\n${data.empChoice}'s role has been updated\n`);
                            
                            viewEmployees();
                            });
                        });
                    });
        });
    });
};

module.exports = {
    viewRoles,
    addRole,
    updateRole

}