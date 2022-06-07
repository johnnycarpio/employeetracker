const inquirer = require('inquirer');
const mysql = require('mysql2');
const consoleTable = require('console.table');

let roleArr = [];
let managersArr = [];
let departmentArr = [];

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'employee_tracker'
});

connection.connect((err) => {
    if (err) throw err;
    console.log(`Connected as ID: ${connection.threadId}`);

    menuPrompt();
});

function menuPrompt() {
    inquirer.prompt([
        {
            type: "list",
            message: 'Select any of the following action:',
            name: 'choice',
            choices: [
                "View All Departments",
                "View All Roles",
                "View All Employees",
                "Add Department",
                "Add Role",
                "Add Employee",
                "Update an Employee Role"
            ]
        }
    ]).then((answer) => {
        switch (answer.choice) {
            case "View All Departments":
                viewAllDepartments();
                break;
            case "View All Roles":
                viewAllRoles();
                break;
            case "View All Employees":
                viewAllEmployees();
                break;
            case "Add Department":
                addDepartment();
                break;
            case "Add Role":
                addRole();
                break;
            case "Add Employee":
                addEmployee();
                break;
            case "Update an Employee Role":
                updateEmployeeRole();
                break;
        }
    });
}

function viewAllDepartments() {
    connection.query("Select * from department", (err, res) => {
        if (err) throw err;
        console.table(res);
        menuPrompt();
    });
}

function viewAllRoles() {
    connection.query("Select r.title, r.salary, d.name from role as r INNER JOIN department as d WHERE r.department_id = d.id", (err, res) => {
        if (err) throw err;
        console.table(res);
        menuPrompt();
    });
}

function viewAllEmployees() {
    connection.query("SELECT emp.first_name, emp.last_name, r.title, r.salary, d.name, CONCAT(e.first_name, ' ' ,e.last_name) AS Manager FROM employee AS emp INNER JOIN role AS r on r.id = emp.role_id INNER JOIN department as d on d.id = r.department_id left join employee e on emp.manager_id = e.id;",
        function (err, res) {
            if (err) throw err
            console.table(res)
            menuPrompt()
        });
}


function selectDepartment() {
    connection.query("SELECT * from department", function (err, res) {
        if (err) throw err
        for (var i = 0; i < res.length; i++) {
            departmentArr.push(res[i].name);
        }

    })
    return departmentArr;
}

function selectRole() {
    connection.query("SELECT * FROM role", function (err, res) {
        if (err) throw err
        for (var i = 0; i < res.length; i++) {
            roleArr.push(res[i].title);
        }

    })
    return roleArr;
}

function selectManager() {
    connection.query("SELECT first_name, last_name FROM employee WHERE manager_id IS NULL", function (err, res) {
        if (err) throw err
        for (var i = 0; i < res.length; i++) {
            managersArr.push(res[i].first_name);
        }

    })
    return managersArr;
}


function addEmployee() {
    inquirer.prompt([
        {
            name: "firstName",
            type: "input",
            message: "Enter Employee first name: "
        },
        {
            name: "lastName",
            type: "input",
            message: "Enter Employee last name: "
        },
        {
            name: "role",
            type: "list",
            message: "What is Employee role: ",
            choices: selectRole()
        },
        {
            name: "choice",
            type: "rawlist",
            message: "Whats Employee managers name: ",
            choices: selectManager()
        }
    ]).then(function (val) {
        var roleId = selectRole().indexOf(val.role) + 1
        var managerId = selectManager().indexOf(val.choice) + 1
        connection.query("INSERT INTO employee SET ?",
            {
                first_name: val.firstName,
                last_name: val.lastName,
                manager_id: managerId,
                role_id: roleId

            }, function (err) {
                if (err) throw err
                console.table(val)
                menuPrompt()
            })

    })
}

function addRole() {
    connection.query("SELECT role.title AS Title, role.salary AS Salary FROM role", function (err, res) {
        inquirer.prompt([
            {
                name: "Title",
                type: "input",
                message: "What is the roles Title?"
            },
            {
                name: "Salary",
                type: "input",
                message: "What is the Salary?"

            },
            {
                name: "Department",
                type: "rawlist",
                message: "Under what department?",
                choices: selectDepartment()
            }
        ]).then(function (res) {
            var departmentId = selectDepartment().indexOf(res.Department) + 1
            connection.query(
                "INSERT INTO role SET ?",
                {
                    title: res.Title,
                    salary: res.Salary,
                    department_id: departmentId
                },
                function (err) {
                    if (err) throw err
                    console.table(res);
                    menuPrompt();
                }
            )

        });
    });
}

function addDepartment() {

    inquirer.prompt([
        {
            name: "name",
            type: "input",
            message: "What Department would you like to add?"
        }
    ]).then(function (res) {
        var query = connection.query(
            "INSERT INTO department SET ? ",
            {
                name: res.name

            },
            function (err) {
                if (err) throw err
                console.table(res);
                menuPrompt();
            }
        )
    })
}

function updateEmployeeRole() {
    connection.query("SELECT employee.last_name, role.title FROM employee JOIN role ON employee.role_id = role.id;", function (err, res) {
        // console.log(res)
        if (err) throw err
        console.log(res)
        inquirer.prompt([
            {
                name: "lastName",
                type: "rawlist",
                choices: function () {
                    var lastName = [];
                    for (var i = 0; i < res.length; i++) {
                        lastName.push(res[i].last_name);
                    }
                    return lastName;
                },
                message: "What is the Employee's last name? ",
            },
            {
                name: "role",
                type: "rawlist",
                message: "What is the Employees new title? ",
                choices: selectRole()
            },
        ]).then(function (val) {
            var roleId = selectRole().indexOf(val.role) + 1
            connection.query("UPDATE employee SET ? WHERE last_name = ?",
                [{ role_id: roleId }, val.lastName],
                function (err) {
                    if (err) throw err
                    console.table(val)
                    menuPrompt()
                })

        });
    });

}

