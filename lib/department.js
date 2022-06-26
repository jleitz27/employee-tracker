const inquirer = require('inquirer');

const connection = require('./connection');

const { promptUser } = require('../server');



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

module.exports = {
    viewDepartment,
    addDept
}