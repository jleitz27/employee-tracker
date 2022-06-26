const mysql = require('mysql2');

const inquirer = require('inquirer'); 

// const connection = require('./lib/connection');

require('dotenv').config();

// const { viewDepartment, addDept } = require('./lib/department');

// const { viewDepartment, addDept } = require('./lib/department');

// const { viewEmployees, addEmployee } = require('./lib/employee');

// const { viewRoles, addRole, updateRole } = require('./lib/employee');



const connection = mysql.createConnection({
  host: 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'employee_db'
});


connection.connect(err => {
    if (err) throw err;
    console.log('********************************');
    console.log('Welcome to the Employee Tracker!');
    console.log('********************************')
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
 
  connection.promise().query(`SELECT * FROM employee`,  (err,data) => {
      if (err) throw err;
      
      const employees = data.map(({ id, first_name, last_name }) => ({ name: first_name + " "+ last_name, value: id }));
      inquirer.prompt(
          [
              {
                  type: 'list',
                  name: 'name',
                  message: 'Whose role would you like to update',
                  choices: employees
                  
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
      promptUser();
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
              promptUser();
          }
      );
  });
};

//view all departments
const viewDepartment = ()=>{
  console.log('Here are all of the departments')
  connection.promise().query('SELECT department.id AS id, department.name AS department FROM department', (err,res) => {
      if (err) throw err;
      console.table(res);
      promptUser();
  })
};

//add department
const addDept = () => {
  //Get departments from DB
  connection.query('SELECT name FROM department', async (err,res) => {
      //Prompt for what dept to add
      if (err) throw err;
      const data = await inquirer.prompt(
          [  
              {
                  type: 'input',
                  name: 'addDept',
                  message: 'What department would you like too add?'
              }
          ]
      );
      //Add the new dept to the db
      connection.query('INSERT INTO department SET ?',
          {
              name: data.addDept
          },
          (err, res) => {
              if (err) throw err;
              //Success message
              console.log(`\n${data.addDept} has been added to departments\n`);
              promptUser();
          }
      );
  });    
};





// promptUser();
// module.exports.promptUser = promptUser