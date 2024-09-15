const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

const app = express();
const port = 8090;

app.use(bodyParser.json());
app.use(express.static('docs')); // Serve static files from 'public' directory

const dataCsvFilePath = path.join(__dirname, 'docs', 'data.csv');
const usersCsvFilePath = path.join(__dirname, 'docs', 'users.csv');
const hierarchyCsvFilePath = path.join(__dirname, 'docs', 'hierarchy_mapping.csv');

// Setup CSV writers for data
//const { createObjectCsvWriter } = require('csv-writer');

const writeCSV = async (filePath, records, append = false) => {
    const csvWriter = createObjectCsvWriter({
        path: filePath,
        header: [
            { id: 'PAN', title: 'PAN' },
            { id: 'TypeOfApplication', title: 'TypeOfApplication' },
            { id: 'DateOfApplication', title: 'DateOfApplication' },
            { id: 'Username', title: 'Username' },
            { id: 'DateOfQuery', title: 'DateOfQuery' },
            { id: 'DateOfDisposal', title: 'DateOfDisposal' }
        ],
        append: false // Set to true if appending records
    });

    await csvWriter.writeRecords(records);
};





// Helper function to read CSV file
const readCsvFile = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                console.log('Read row:', data); // Debugging statement
                results.push(data);
            })
            .on('end', () => {
                console.log('CSV read complete:', results); // Debugging statement
                resolve(results);
            })
            .on('error', (error) => {
                console.error('Error reading CSV file:', error); // Debugging statement
                reject(error);
            });
    });
};

// Load hierarchy from CSV
const loadHierarchy = async () => {
    try {
        const hierarchyData = await readCsvFile(hierarchyCsvFilePath);
        const hierarchy = {};

        hierarchyData.forEach(row => {
            if (row.Boss && row.Employees) {
                const boss = row.Boss;
                const employees = row.Employees.split(',').map(e => e.trim());
                console.log(`Parsed hierarchy row - Boss: ${boss}, Employees: ${employees}`); // Debugging statement
                hierarchy[boss] = employees;
            } else {
                console.error(`Invalid data in row: ${JSON.stringify(row)}`); // Debugging statement
            }
        });

        console.log('Loaded hierarchy:', hierarchy); // Debugging statement
        return hierarchy;
    } catch (error) {
        console.error('Error loading hierarchy:', error); // Debugging statement
        throw error;
    }
};

// Iterative function to find all permissions for a user
const findPermissions = (hierarchy, user, permissions = new Set()) => {
    const stack = [user];

    while (stack.length > 0) {
        const currentUser = stack.pop();

        if (permissions.has(currentUser)) {
            continue;
        }

        permissions.add(currentUser);

        const employees = hierarchy[currentUser];

        if (employees) {
            employees.forEach(emp => {
                if (!permissions.has(emp)) {
                    stack.push(emp);
                }
            });
        }
    }
};

// Get user permissions based on hierarchy
const getUserPermissions = async (username) => {
    try {
        const hierarchy = await loadHierarchy();
        const permissions = new Set();

        findPermissions(hierarchy, username, permissions);

        console.log(`Permissions for ${username}:`, Array.from(permissions)); // Debugging statement
        return Array.from(permissions);
    } catch (error) {
        console.error('Error getting user permissions:', error); // Debugging statement
        return [];
    }
};

// Authenticate user
const authenticateUser = async (username, password) => {
    try {
        const users = await readCsvFile(usersCsvFilePath);
        console.log('Users data:', users); // Debugging statement
        const user = users.find(u => u.username === username && u.password === password);
        console.log('Authenticated user:', user); // Debugging statement
        return user || null;
    } catch (error) {
        console.error('Error authenticating user:', error); // Debugging statement
        return null;
    }
};

// Handle login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await authenticateUser(username, password);

        if (user) {
            const permissions = await getUserPermissions(username);
            if (permissions.length > 0) {
                res.json({ success: true, username: user.username, role: user.role, hierarchy: permissions });
            } else {
                res.status(401).send('User not found in hierarchy');
            }
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.post('/submit', async (req, res) => {
    const { pan, typeOfApplication, dateOfApplication, username } = req.body;
    console.log('Received form submission:', { pan, typeOfApplication, dateOfApplication, username });

    try {
        const permissions = await getUserPermissions(username);

        // Check if the user has permissions to submit data
        if (permissions.length > 0) {
            // Load existing records
            const records = await readCsvFile(dataCsvFilePath);

            // Append new record with default values for missing fields
            records.push({
                PAN: pan || '',
                TypeOfApplication: typeOfApplication || '',
                DateOfApplication: dateOfApplication || '',
                Username: username || '',
                DateOfQuery: '',
                DateOfDisposal: ''
            });

            // Write updated records to CSV
            await writeCSV(dataCsvFilePath, records, true); // Append new records
            res.send('Data saved');
        } else {
            res.status(403).send('User not authorized to submit details');
        }
    } catch (error) {
        console.error('Error during form submission:', error);
        res.status(500).send('Internal Server Error');
    }
});




app.post('/update-date', async (req, res) => {
    const { rowId, field, date } = req.body;
    console.log('Received request to update date:', { rowId, field, date }); // Debugging statement

    try {
        // Load the existing CSV records
        const records = await readCsvFile(dataCsvFilePath);
        console.log('Loaded records:', records); // Debugging statement

        // Check if the record at rowId exists
        if (records[rowId]) {
            console.log('Original record:', records[rowId]); // Debugging statement

            // Ensure field name matches exactly with the CSV header
            if (field === 'DateOfQuery'  || field === 'DateOfDisposal') {
                // Update the DateOfDisposal field
                records[rowId][field] = date;
                console.log('Updated record:', records[rowId]); // Debugging statement

                // Write the updated records back to the CSV file
                await writeCSV(dataCsvFilePath, records);
                console.log('Records written to CSV successfully.'); // Debugging statement

                res.send('Date updated successfully');
            } else {
                console.error('Invalid field name:', field); // Debugging statement
                res.status(400).send('Invalid field name');
            }
        } else {
            console.error('Record not found at index:', rowId); // Debugging statement
            res.status(404).send('Record not found');
        }
    } catch (error) {
        console.error('Error updating date:', error); // Debugging statement
        res.status(500).send('Internal Server Error');
    }
});






const findHierarchyPath = (hierarchy, startUser, endUser) => {
    const stack = [[startUser]]; // Stack to hold the paths
    const visited = new Set(); // Set to keep track of visited nodes
    const pathMap = new Map(); // Map to store each node's predecessor

    visited.add(startUser);
    pathMap.set(startUser, null); // Start of the path

    while (stack.length > 0) {
        const currentPath = stack.pop();
        const currentUser = currentPath[currentPath.length - 1];

        if (currentUser === endUser) {
            // Reconstruct the path from startUser to endUser
            const fullPath = [];
            let step = endUser;
            while (step !== null) {
                fullPath.unshift(step);
                step = pathMap.get(step);
            }
            return fullPath;
        }

        const employees = hierarchy[currentUser];
        if (employees) {
            employees.forEach(emp => {
                if (!visited.has(emp)) {
                    visited.add(emp);
                    pathMap.set(emp, currentUser); // Track the predecessor
                    stack.push([...currentPath, emp]); // Extend the path
                }
            });
        }
    }

    // Return an empty array if no path is found
    return [];
};


//app.get('/data', async (req, res) => {
//    const { username } = req.query;
//    console.log('Retrieved username from query:', username); // Debugging statement
//
//    try {
//        const hierarchy = await loadHierarchy();
//        const permissions = await getUserPermissions(username);
//
//        if (permissions.length > 0) {
//            const allowedUsers = new Set([...permissions, username]);
//
//            // Collect all data from allowed users
//            const allData = await readCsvFile(dataCsvFilePath);
//            const result = [];
//
//            for (const record of allData) {
//                if (allowedUsers.has(record.Username)) {
//                    // Find the path between the current user and the submitter
//                    const additionalUsers = findHierarchyPath(hierarchy, username, record.Username);
//                    result.push({
//                        ...record,
//                        additional_users: additionalUsers // Include the additional users in the record
//                    });
//                }
//            }
//
//            console.log('Filtered data with additional users:', result); // Debugging statement
//            res.json(result);
//        } else {
//            res.status(403).send('User not authorized to view data');
//        }
//    } catch (error) {
//        console.error('Error retrieving data:', error); // Debugging statement
//        res.status(500).send('Internal Server Error');
//    }
//});

app.get('/data', async (req, res) => {
    const { username } = req.query;
    console.log('Retrieved username from query:', username); // Debugging statement

    try {
        const hierarchy = await loadHierarchy();
        const permissions = await getUserPermissions(username);

        if (permissions.length > 0) {
            const allowedUsers = new Set([...permissions, username]);

            // Collect all data from allowed users
            const allData = await readCsvFile(dataCsvFilePath);
            const result = [];

            for (const record of allData) {
                if (allowedUsers.has(record.Username) && !record.DateOfDisposal) {
                    // Find the path between the current user and the submitter
                    const additionalUsers = findHierarchyPath(hierarchy, username, record.Username);
                    result.push({
                        ...record,
                        additional_users: additionalUsers // Include the additional users in the record
                    });
                }
            }

            console.log('Filtered data with additional users:', result); // Debugging statement
            res.json(result);
        } else {
            res.status(403).send('User not authorized to view data');
        }
    } catch (error) {
        console.error('Error retrieving data:', error); // Debugging statement
        res.status(500).send('Internal Server Error');
    }
});


app.get('/disposed-applications', async (req, res) => {
    const { username } = req.query;
    console.log('Retrieved username from query:', username); // Debugging statement

    try {
        const hierarchy = await loadHierarchy();
        const permissions = await getUserPermissions(username);

        if (permissions.length > 0) {
            const allowedUsers = new Set([...permissions, username]);

            // Collect all data from allowed users
            const allData = await readCsvFile(dataCsvFilePath);
            const result = [];

            for (const record of allData) {
                if (allowedUsers.has(record.Username) && record.DateOfDisposal) {
                    // Find the path between the current user and the submitter
                    const additionalUsers = findHierarchyPath(hierarchy, username, record.Username);
                    result.push({
                        ...record,
                        additional_users: additionalUsers // Include the additional users in the record
                    });
                }
            }

            console.log('Filtered disposed data with additional users:', result); // Debugging statement
            res.json(result);
        } else {
            res.status(403).send('User not authorized to view data');
        }
    } catch (error) {
        console.error('Error retrieving disposed applications:', error); // Debugging statement
        res.status(500).send('Internal Server Error');
    }
});



// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'docs')));

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
