const express = require('express');
const app = express();
const body = require('body-parser');
const jwt = require('jsonwebtoken');

app.use(express.json());
app.use(body.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

function generateTokenForAdmin(username, password) {
    return jwt.sign({username: username, password: password}, "AdminSecret", {expiresIn: '1h'});
}

function generateTokenForUser(username, password) {
    return jwt.sign({username: username, password: password}, "UserSecret");
}

function checkAdmin(req, res, next) {
    const {username, password} = req.body;
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
}

function checkUser(req, res, next) {
    const {username, password} = req.body;
    const user = USERS.find(admin => admin.username === username);
    if (user) {
        if (user.password === password) {
            next();
        } else {
            res.status(400).send("Incorrect password");
        }
    } else {
        res.status(403).send("You are not an admin");
    }
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
    const adminUser = ADMINS.find(admin => admin.username === username);
    if (adminUser) {
        res.status(400).send("You are already an admin");
    } else {
        const token = generateTokenForAdmin(username, password);
        ADMINS.push(req.body);
        res.json({message: "Admin created successfully", token: token});
    }
});

app.post('/admin/login', checkAdmin, (req, res) => {
    const {username, password} = req.body;
    const token = generateTokenForAdmin(username, password);
    res.json({message: "Logged in successfully", token: token});
});

app.post('/admin/courses', verifyAdminToken, (req, res) => {
    let courseId = Math.floor(Math.random() * 1000);
    COURSES.push({...req.body, id: courseId});
    res.json({message: "Course created successfully", courseId: courseId});
});

app.put('/admin/courses/:courseId', verifyAdminToken, (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const course = COURSES.find(course => course.id === courseId);
    if (course) {
        Object.assign(course, req.body);
        res.send("Course updated successfully");
    } else {
        res.status(404).json({message: 'Course not found'});
    }

});

app.get('/admin/courses', verifyAdminToken, (req, res) => {
    res.json({courses: COURSES});
});

// User routes
app.post('/users/signup', (req, res) => {
    const {username, password} = req.body;
    const User = USERS.find(admin => admin.username === username);
    if (User) {
        res.status(400).send("You have already signed up, please sign in!");
    } else {
        const token = generateTokenForUser(username, password);
        USERS.push({...req.body, purchasedCourses: []});
        res.json({message: "User created successfully", token: token});
    }
});

app.post('/users/login', checkUser, (req, res) => {
    const {username, password} = req.body;
    const token = generateTokenForUser(username, password);
    res.json({message: "Logged in successfully", token: token});
});

app.get('/users/courses', verifyUserToken, (req, res) => {
    const courses = COURSES.filter(course => course.published)
    return res.json({courses: courses});
});

app.post('/users/courses/:courseId', verifyUserToken, (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const course = COURSES.find(course => course.id === courseId && course.published);
    if (course) {
        const user = USERS.find(user => user.username === req.userCredentials.username);
        user.purchasedCourses.push(course);
        res.json({message: "Course purchased successfully"});
    } else {
        res.status(404).json({message: 'Course not found'});
    }
});

app.get('/users/purchasedCourses', verifyUserToken, (req, res) => {
    const user = USERS.find(user => user.username === req.userCredentials.username);
    res.json({purchasedCourses: user.purchasedCourses});
});

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
