INSERT INTO department (name)
VALUES 
('Engineering'),
('Finance'),
('Sales'),
('Legal');

INSERT INTO role (title, salary, department_id)
VALUES
('Software Engineer', 80000, 1),
('Lead Engineer', 130000, 1),
('Accountant', 100000, 2), 
('Account Manager', 120000, 2),
('Salesperson', 60000, 3), 
('Sales Team Lead', 90000, 3),
('Legal Team Lead', 100000, 4),
('Lawyer', 90000, 4);


INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES 
('Bob', 'Jones', 2, null),
('Lisa', 'Simpson', 1, 1),
('Gene', 'Belcher', 4, null),
('Michael', 'Jordan', 3, 3),
('Monica', 'Geller', 6, null),
('Jim', 'Halpert', 5, 5),
('Clark', 'Kent', 7, null),
('Bruce', 'Wayne', 8, 7);
