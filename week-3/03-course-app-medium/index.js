const express = require('express');
const app = express();
const fs = require('fs');
const body = require('body-parser');
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(body.json());

// A better alternate would be :
// ADMINS = JSON.parse(fs.readFileSync('admins.json', 'utf8'));
// USERS = JSON.parse(fs.readFileSync('users.json', 'utf8'));
// COURSES = JSON.parse(fs.readFileSync('courses.json', 'utf8'));
function generateTokenForAdmin(username, password) {
    return jwt.sign({username: username, password: password}, "AdminSecret", {expiresIn: '1h'});
}

function generateTokenForUser(username, password) {
    return jwt.sign({username: username, password: password}, "UserSecret");
}

function checkAdmin(req, res, next) {
    const {username, password} = req.body;
    fs.readFile('admins.json', 'utf8', (err, data) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send("Internal Server Error");
        }
        const ADMINS = JSON.parse(data);
        const adminUser = ADMINS.find(admin => admin.username === username);
        if (adminUser) {
            if (adminUser.password === password) {
                next();
            } else {
                res.status(400).send("Incorrect password");
            }
        } else {
            res.status(403).send("You are not an admin");
        }
    });
}

function checkUser(req, res, next) {
    const {username, password} = req.body;
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send("Internal Server Error");
        }
        const USERS = JSON.parse(data);
        const user = USERS.find(user => user.username === username);
        if (user) {
            if (user.password === password) {
                next();
            } else {
                res.status(400).send("Incorrect password");
            }
        } else {
            res.status(403).send("You are not an admin");
        }
    });
}

function verifyAdminToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, "AdminSecret", (err, decoded) => {
            if (err) {
                return res.status(401).json({message: 'Invalid token'});
            }
            req.userCredentials = decoded;
            next();
        });
    } else {
        return res.status(401).json({message: 'Missing token'});
    }
};

function verifyUserToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, "UserSecret", (err, decoded) => {
            if (err) {
                return res.status(401).json({message: 'Invalid token'});
            }
            req.userCredentials = decoded;
            next();
        });
    } else {
        return res.status(401).json({message: 'Missing token'});
    }
};

// Admin routes
app.post('/admin/signup', (req, res) => {
    const {username, password} = req.body;
    fs.readFile('admins.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send("Internal Server Error");
        }
        const ADMINS = JSON.parse(data);
        const adminUser = ADMINS.find(admin => admin.username === username);
        if (adminUser) {
            res.status(400).send("You are already an admin");
        } else {
            const token = generateTokenForAdmin(username, password);
            ADMINS.push(req.body);
            fs.writeFile('admins.json', JSON.stringify(ADMINS), err1 => {
                if (err) {
                    console.log(err.message);
                }
                res.json({message: "Admin created successfully", token: token});
            });
        }
    })
});

app.post('/admin/login', checkAdmin, (req, res) => {
    const {username, password} = req.body;
    const token = generateTokenForAdmin(username, password);
    res.json({message: "Logged in successfully", token: token});
});

app.post('/admin/courses', verifyAdminToken, (req, res) => {

    fs.readFile('courses.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send("Internal Server error");
        }
        let courseId = Math.floor(Math.random() * 1000);
        const COURSES = JSON.parse(data);
        COURSES.push({id: courseId, ...req.body});
        fs.writeFile('courses.json', JSON.stringify(COURSES), err => {
            if (err) {
                return res.status(500).send("Internal Server error");
            }
            res.json({message: "Course created successfully", courseId: courseId});
        });
    });
});

app.put('/admin/courses/:courseId', verifyAdminToken, (req, res) => {
    const courseId = parseInt(req.params.courseId);
    fs.readFile('courses.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send("Internal Server error");
        }
        const COURSES = JSON.parse(data);
        const course = COURSES.find(course => course.id === courseId);
        if (course) {
            Object.assign(course, req.body);
            fs.writeFile('courses.json', JSON.stringify(COURSES), err => {
                if (err) {
                    return res.status(500).send("Internal Server error");
                }
                res.send("Course updated successfully");
            });
        } else {
            res.status(404).json({message: 'Course not found'});
        }
    });
});

app.get('/admin/courses', (req, res) => {
    fs.readFile('courses.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send("Internal Server error");
        }
        const COURSES = JSON.parse(data);
        res.json({courses: COURSES});
    });
});

// User routes
app.post('/users/signup', (req, res) => {
    fs.readFile('users.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send("Internal Server error");
        }
        const USERS = JSON.parse(data);
        const {username, password} = req.body;
        const User = USERS.find(admin => admin.username === username);
        if (User) {
            res.status(400).send("You have already signed up, please sign in!");
        } else {
            const token = generateTokenForUser(username, password);
            USERS.push({...req.body, purchasedCourses: []});
            fs.writeFile('users.json', JSON.stringify(USERS), err => {
                if (err) {
                    console.log(err.message);
                    return res.status(500).send("Internal Server error");
                }
                res.json({message: "User created successfully", token: token});
            });
        }
    });
});

app.post('/users/login', checkUser, (req, res) => {
    const {username, password} = req.body;
    const token = generateTokenForUser(username, password);
    res.json({message: "Logged in successfully", token: token});
});

app.get('/users/courses', verifyUserToken, (req, res) => {
    fs.readFile('courses.json', 'utf8', (err, data) => {
        if (err) {
            console.log(err.message);
            res.status(500).send("Internal Server error");
        }
        const COURSES = JSON.parse(data);
        const courses = COURSES.filter(course => course.published);
        return res.json({courses: courses});
    });
});

app.post('/users/courses/:courseId', verifyUserToken, (req, res) => {
    const courseId = parseInt(req.params.courseId);
    fs.readFile('courses.json', 'utf8', (err, data) => {
        if (err) {
            console.log(err.message);
            res.status(500).send("Internal Server error");
        }
        const COURSES = JSON.parse(data);
        const course = COURSES.find(course => course.id === courseId && course.published);
        if (course) {
            fs.readFile('users.json', 'utf8', (err, data) => {
                if (err) {
                    console.log(err.message);
                    res.status(500).send("Internal Server error");
                }
                const USERS = JSON.parse(data);
                const userIndex = USERS.findIndex(user => user.username === req.userCredentials.username);
                USERS[userIndex].purchasedCourses.push(course);
                fs.writeFile("users.json", JSON.stringify(USERS), err => {
                    if (err) {
                        console.log(err.message);
                        res.status(500).send("Internal Server error");
                    }
                    res.json({message: "Course purchased successfully"});
                });
            });
        } else {
            res.status(404).json({message: 'Course not found'});
        }
    });
});

app.get('/users/purchasedCourses', verifyUserToken, (req, res) => {
    fs.readFile('users.json','utf8',(err, data)=>{
        if (err) {
            console.log(err.message);
            res.status(500).send("Internal Server error");
        }
        const USERS = JSON.parse(data);
        const user = USERS.find(user => user.username === req.userCredentials.username);
        res.json({purchasedCourses: user.purchasedCourses});
    });
});

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});