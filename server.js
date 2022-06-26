const mysql = require('mysql2');

const inquirer = require('inquirer'); 

require('dotenv').config();

// const { viewDepartment, addDept } = require('./lib/department');

// const { viewEmployees, addEmployee } = require('./lib/employee');

// const { viewRoles, addRole, updateRole } = require('./lib/employee');

// const connection = require('./lib/connection');

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