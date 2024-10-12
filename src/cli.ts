import inquirer from 'inquirer';
import { pool } from './connection.js'
import { QueryResult } from 'pg';
import { printTable } from 'console-table-printer';

class Cli {
    constructor() {
        
    }

    startCli(): void {
        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What would you like to do?',
                    choices: [
                        'View All Employees',
                        'Add Employee',
                        'Update Employee Role',
                        'View All Roles',
                        'Add Role',
                        'View All Departments',
                        'Add Department'
                    ]
                }
            ])
            .then((res) => {
                // inquirer options
                switch (res.action) {
                    case 'View All Employees':
                        this.viewAllEmployees();
                        break;
                    case 'Add Employee':
                        this.addEmployee();
                        break;
                    case 'Update Employee Role':
                        this.updateEmployeeRole();
                        break;
                    case 'View All Roles':
                        this.viewAllRoles();
                        break;
                    case 'Add Role':
                        this.addRole();
                        break;
                    case 'View All Departments':
                        this.viewAllDepartments();
                        break;
                    case 'Add Department':
                        this.addDepartment();
                        break;
                }
            });
    }

    viewAllEmployees(): void {
        // print employee id, first_name, last_name, title, department, salary, and manager
        const sql = "SELECT e.id, e.first_name, e.last_name, role.title, department.name AS department, role.salary, CASE WHEN e.manager_id IS NULL THEN 'null' ELSE m.first_name || ' ' || m.last_name END AS manager FROM employee e LEFT JOIN employee m ON e.manager_id = m.id JOIN role ON e.role_id = role.id JOIN department ON role.department_id = department.id";
        pool.query(sql, (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else if (result) {
                //   console.table(result.rows);
                console.log('\n');
                printTable(result.rows);
                const lineBuffer = Math.round(result.rowCount as number * 0.6);
                for (let i = 0; i < lineBuffer; i++) {
                    console.log('\n');       
                }
            }
        });
        this.startCli();
    }

    addEmployee(): void {
        // get array of available roles to give employee'
        const roles: string[] = [];
        pool.query('SELECT title FROM role', (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else if (result) {
                result.rows.forEach(role => {
                    roles.push(role.title);
                });
            }
        });

        // get array of available employees to assign as manager'
        const potentialManagers: string[] = [];
        pool.query("SELECT first_name || ' ' || last_name AS name FROM employee", (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else if (result) {
                result.rows.forEach(potManager => {
                    potentialManagers.push(potManager.name);
                });
            }
        });

        inquirer
        .prompt([
            {
                type: 'input',
                name: 'fname',
                message: "What is the employee's first name?",
            },
            {
                type: 'input',
                name: 'lname',
                message: "What is the employee's last name?",
            },
            {
                type: 'list',
                name: 'role',
                message: "What is the employee's role?",
                choices: roles,
            },
            {
                type: 'list',
                name: 'manager',
                message: "Who is the employee's manager?",
                choices: potentialManagers,
            }
        ])
        .then((res) => {
            // get role id by querying role.title
            let roleId: number;
            let managerId: number;

            pool.query(`SELECT id FROM role WHERE title = $1`, [res.role], (err: Error, result: QueryResult) => {
                if (err) {
                    console.log(err);
                } else if (result) {
                    // get the role id from the result object
                    roleId = result.rows[0].id;

                    // get manager id by querying employees                    
                    pool.query(`SELECT id FROM employee WHERE first_name || ' ' || last_name = $1`, [res.manager], (err: Error, result: QueryResult) => {
                        if (err) {
                            console.log(err);
                        } else if (result) {
                            managerId = result.rows[0].id;

                            // insert the role into the correct department
                            // perform this query inside of the other queries due to async response causing the ids to not be available otherwise
                            pool.query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)`, [res.fname, res.lname, roleId, managerId], (err: Error, result: QueryResult) => {
                                if (err) {
                                    console.log(err);
                                } else if (result) {
                                    console.log(`Added ${res.fname} ${res.lname} to the database`);
                                    this.startCli();
                                }
                            });
                        }
                    });        
                }
            });
        });
    }

    updateEmployeeRole(): void {
        // get array of employees
        const allEmployees: string[] = [];
        const roles: string[] = [];

        pool.query("SELECT first_name || ' ' || last_name AS name FROM employee", (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else if (result) {
                result.rows.forEach(employee => {
                    allEmployees.push(employee.name);
                });

                // get array of available roles to give employee        
                pool.query('SELECT title FROM role', (err: Error, result: QueryResult) => {
                    if (err) {
                    console.log(err);
                    } else if (result) {
                        result.rows.forEach(role => {
                            roles.push(role.title);
                        });

                        inquirer
                        .prompt([
                            {
                                type: 'list',
                                name: 'employee',
                                message: "Which employee's role do you want to update?",
                                choices: allEmployees,
                            },
                            {
                                type: 'list',
                                name: 'role',
                                message: "Which role do you want to assign the selected employee?",
                                choices: roles,
                            }
                        ])
                        .then((res) => {
                            // get role id by querying role.title
                            let employeeId: number;
                            let roleId: number;

                            pool.query(`SELECT id FROM role WHERE title = $1`, [res.role], (err: Error, result: QueryResult) => {
                                if (err) {
                                    console.log(err);
                                } else if (result) {
                                    // get the role id from the result object
                                    roleId = result.rows[0].id;

                                    // get employee id by querying employees                    
                                    pool.query(`SELECT id FROM employee WHERE first_name || ' ' || last_name = $1`, [res.employee], (err: Error, result: QueryResult) => {
                                        if (err) {
                                            console.log(err);
                                        } else if (result) {
                                            employeeId = result.rows[0].id;

                                            // update the employee's role
                                            pool.query(`UPDATE employee SET role_id = $1 WHERE id = $2`, [roleId, employeeId], (err: Error, result: QueryResult) => {
                                                if (err) {
                                                    console.log(err);
                                                } else if (result) {
                                                    console.log(`Updated employee's role`);
                                                    this.startCli();
                                                }
                                            });
                                        }
                                    });        
                                }
                            });
                        });
                    }
                });
            }
        });       

        
    }

    viewAllRoles(): void {
        // print all role ids, titles, departments, and salaries
        pool.query('SELECT role.id, role.title, department.name AS department, role.salary FROM role JOIN department ON role.department_id = department.id', (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else if (result) {
                console.log('\n');
                printTable(result.rows);
                const lineBuffer = Math.round(result.rowCount as number * 0.6);
                for (let i = 0; i < lineBuffer; i++) {
                    console.log('\n');       
                }
            }
        });
        this.startCli();
    }

    addRole(): void {
        // get array of available departments to add role to
        const departments: string[] = [];
        pool.query('SELECT name FROM department', (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else if (result) {
                result.rows.forEach(department => {
                    departments.push(department.name);
                });
            }
        });

        inquirer
        .prompt([
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of the role?',
            },
            {
                type: 'input',
                name: 'salary',
                message: 'What is the salary of the role?',
            },
            {
                type: 'list',
                name: 'department',
                message: 'Which department does the role belong to?',
                choices: departments,
            }
        ])
        .then((res) => {
            // get department id by querying department.name
            let departmentId;

            pool.query(`SELECT id FROM department WHERE name = $1`, [res.department], (err: Error, result: QueryResult) => {
                if (err) {
                    console.log(err);
                } else if (result) {
                    // get the department id from the result object
                    departmentId = result.rows[0].id;

                    // insert the role into the correct department
                    // perform this query inside of the first query due to async response causing the id to not be available otherwise
                    pool.query(`INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)`, [res.name, res.salary, departmentId], (err: Error, result: QueryResult) => {
                        if (err) {
                        console.log(err);
                        } else if (result) {
                            console.log(`Added ${res.name} to the database`);
                            this.startCli();
                        }
                    });
        
                }
            });
        });
    }

    viewAllDepartments(): void {
        // print all department ids and names
        pool.query('SELECT id, name FROM department', (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else if (result) {
                console.log('\n');
                printTable(result.rows);
                const lineBuffer = result.rowCount as number;
                for (let i = 0; i < lineBuffer; i++) {
                    console.log('\n');       
                }
            }
        });
        this.startCli();
    }

    addDepartment(): void {
        inquirer
        .prompt([
            {
                type: 'input',
                name: 'name',
                message: 'What is the name of the department?',
            }
        ])
        .then((res) => {
            // add the department
            pool.query(`INSERT INTO department (name) VALUES ($1)`, [res.name], (err: Error, result: QueryResult) => {
                if (err) {
                console.log(err);
                } else if (result) {
                    console.log(`Added ${res.name} to the database`);
                }
            });  

            this.startCli();
        });
    }
}
export default Cli;