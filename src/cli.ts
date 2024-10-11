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
                const lineBuffer = Math.round(result.rowCount as number * 0.75);
                for (let i = 0; i < lineBuffer; i++) {
                    console.log('\n');       
                }
            }
        });
        this.startCli();
    }

    addEmployee(): void {
        // TODO
    }

    updateEmployeeRole(): void {
        // TODO
    }

    viewAllRoles(): void {
        // print all role ids, titles, departments, and salaries
        pool.query('SELECT role.id, role.title, department.name AS department, role.salary FROM role JOIN department ON role.department_id = department.id', (err: Error, result: QueryResult) => {
            if (err) {
              console.log(err);
            } else if (result) {
                console.log('\n');
                printTable(result.rows);
                const lineBuffer = Math.round(result.rowCount as number * 0.75);
                for (let i = 0; i < lineBuffer; i++) {
                    console.log('\n');       
                }
            }
        });
        this.startCli();
    }

    addRole(): void {
        // TODO
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
            pool.query(`INSERT INTO department (name) VALUES ('${res.name}')`, (err: Error, result: QueryResult) => {
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