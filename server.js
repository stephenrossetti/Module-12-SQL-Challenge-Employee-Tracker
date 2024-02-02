const inquirer = require('inquirer');
const mySQL = require('mysql2');
require('dotenv').config();
const cfonts = require('cfonts');
const { initialQuestions, endQuestions, employeeQuestions, departmentQuestions, updateQuestions } = require('./helpers/questions');

const db = mySQL.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

cfonts.say('NFL Company!', {
    font: 'block',              // define the font face
    align: 'left',              // define text alignment
    colors: ['system'],         // define all colors
    background: 'transparent',  // define the background color, you can also use `backgroundColor` here as key
    letterSpacing: 1,           // define letter spacing
    lineHeight: 1,              // define the line height
    space: true,                // define if the output text should have empty lines on top and on the bottom
    maxLength: '0',             // define how many character can be on one line
    gradient: false,            // define your two gradient colors
    independentGradient: false, // define if you want to recalculate the gradient for each new line
    transitionGradient: false,  // define if this is a transition between colors directly
    env: 'node'                 // define the environment cfonts is being executed in
});

let init = async () => {
    const answer = await inquirer.prompt(initialQuestions);
    switch (answer.choice) {
        case 'View Employees':
            viewEmployees();
            break;
        case 'View Employees by Department':
            viewEmployeeByDepartment();
            break;
        case 'View Departments':
            viewDepartments();
            break;
        case 'View Roles':
            viewRoles();
            break;
        case 'Add New Employee':
            addNewEmployee();
            break;
        case 'Add New Department':
            addNewDepartment();
            break;
        case 'Add New Role':
            const departmentList = "SELECT * FROM departments";
            db.query(departmentList, (err, res) => {
                if (err) throw err;
                inquirer.prompt([
                    {
                        type: 'input',
                        name: 'roleName',
                        message: 'Enter title of new role:',
                    },
                    {
                        type: 'input',
                        name: 'roleSalary',
                        message: 'Enter salary of new role:',
                    },
                    {
                        type: 'list',
                        name: 'department',
                        message: 'Select department of new role:',
                        choices: res.map((department) => department.department_name),
                    },
                ])
                    .then((answers) => {
                        const selectedDepartment = res.find((department) => department.department_name === answers.department);
                        db.query('INSERT INTO roles (role_name, role_salary, department_id) VALUES (?,?,?)',
                            [answers.roleName, answers.roleSalary, selectedDepartment], (err, result) => {
                                if (err) throw err
                                console.log('New role added!')
                                console.table(result)
                                mainMenu();
                            })
                    })
            });
            break;
        case 'Update An Employees Role':
            const answerER = await inquirer.prompt(updateQuestions);
            db.query('UPDATE employees SET roles_id = ? WHERE id = ?',
                [answerER.updateRole, answerER.updateEmployee], (err, result) => {
                    if (err) throw err
                    console.log('Employee updated!')
                    console.table(result)
                    mainMenu();
                });
            break;
        case 'Exit':
            exit();
            break;
    }
}

const mainMenu = () => {
    inquirer.prompt(endQuestions)
        .then((answer) => {
            switch (answer.choice) {
                case 'Main Menu':
                    init();
                    break;
                case 'Quit':
                    exit();
            }
        })
};

const exit = () => {
    console.log('Exiting');
    process.exit();
}

init();

const viewEmployees = () => {
    db.query(`SELECT employees.id, employees.first_name, employees.last_name, roles.role_name, departments.department_name, roles.role_salary,
    CONCAT(manager.first_name,' ',manager.last_name) AS manager_name
    FROM employees
    JOIN roles ON employees.roles_id = roles.id
    JOIN departments ON roles.department_id = departments.id
    LEFT JOIN employees AS manager ON employees.manager_id = manager.id`,
        (err, result) => {
            if (err) throw err
            console.log('You are viewing all employees!')
            console.table(result)
            mainMenu();
        });
};

const viewDepartments = () => {
    db.query(`SELECT * FROM departments`,
        (err, result) => {
            if (err) throw err
            console.log('You are viewing all departments!')
            console.table(result)
            mainMenu();
        });
};

const viewRoles = () => {
    db.query(`SELECT roles.id, roles.role_name, roles.role_salary, departments.department_name
FROM roles JOIN departments ON roles.department_id = departments.id`,
        (err, result) => {
            if (err) throw err
            console.log('You are viewing all roles!')
            console.table(result)
            mainMenu();
        });
};

const addNewEmployee = async () => {
    const answerNE = await inquirer.prompt(employeeQuestions);
    db.query('INSERT INTO employees (first_name, last_name, roles_id, manager_id) VALUES (?,?,?,?)',
        [answerNE.firstName, answerNE.lastName, answerNE.roleID, answerNE.managerID], (err, result) => {
            if (err) throw err
            console.log('New employee added!')
            console.table(result)
            mainMenu();
        });
};

const addNewDepartment = async () => {
    const answerND = await inquirer.prompt(departmentQuestions);
    db.query('INSERT INTO departments (department_name) VALUES (?)',
        [answerND.departmentName], (err, result) => {
            if (err) throw err
            console.log('New department added!')
            console.table(result)
            mainMenu();
        });
};

//TODO//
const viewEmployeeByDepartment = async () => {
const deptList = "SELECT * FROM departments";
db.query(deptList, (err, res) => {
    if (err) throw err;
    inquirer.prompt([
        {
            type: 'list',
            name: 'department',
            message: 'Select department of to view employees:',
            choices: res.map((department) => department.department_name),
        },
    ])
})
};