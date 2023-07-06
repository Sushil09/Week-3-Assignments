const express = require('express');
const app = express();

const bodyParser = require('body-parser');

app.use(express.json());
app.use(bodyParser.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

// Admin routes
app.post('/admin/signup', (req, res) => {
    let {username, password} = req.body;
    let AlreadyAdmin = ADMINS.find((admin) => admin.username === username);
    if (AlreadyAdmin) {
        res.status(400).send("Admin already exists");
    } else {
        ADMINS.push({username: username, password: password});
        res.send("Admin created successfully");
    }
});

app.post('/admin/login', (req, res) => {
    const {username, password} = req.headers;
    const AlreadyAdmin = ADMINS.find((admin) => admin.username === username);
    if (AlreadyAdmin) {
        if (AlreadyAdmin.password === password) {
            res.send("Logged in successfully");
        } else {
            res.status(400).send("Incorrect password, please type correct password");
        }
    } else {
        res.status(404).send("You are not an admin");
    }
});

app.post('/admin/courses', (req, res) => {
    const {username, password} = req.headers;
    const {title, description, price, imageLink, published} = req.body;
    let courseId = Math.floor(Math.random() * 1000);
    const AlreadyAdmin = ADMINS.find((admin) => admin.username === username);
    if (AlreadyAdmin) {
        if (AlreadyAdmin.password === password) {
            COURSES.push({
                title: title,
                description: description,
                price: price,
                imageLink: imageLink,
                published: published,
                courseId: courseId
            });
            res.json({message: "Course created successfully", courseId: courseId})
        } else {
            res.status(400).send("Incorrect credentials, please type correct password");
        }
    } else {
        res.status(404).send("You are not an admin or please check the username you have typed");
    }
});

app.put('/admin/courses/:courseId', (req, res) => {
    const {username, password} = req.headers;
    const courseId = Number(req.params.courseId);
    const {title, description, price, imageLink, published} = req.body;
    const AlreadyAdmin = ADMINS.find((admin) => admin.username === username);
    if (AlreadyAdmin) {
        if (AlreadyAdmin.password === password) {
            //admin user
            const course = COURSES.find((course) => course.courseId === courseId);
            course.title = title;
            course.description = description;
            course.price = price;
            course.imageLink = imageLink;
            course.published = published;
            res.json("Course updated successfully");
        } else {
            res.status(400).send("Incorrect credentials, please type correct password");
        }
    } else {
        res.status(404).send("You are not an admin or please check the username you have typed");
    }
});

app.get('/admin/courses', (req, res) => {
    const {username, password} = req.headers;
    const AlreadyAdmin = ADMINS.find((admin) => admin.username === username);
    if (AlreadyAdmin) {
        if (AlreadyAdmin.password === password) {
            res.json({courses: COURSES});
        } else {
            res.status(400).send("Incorrect credentials, please type correct password");
        }
    } else {
        res.status(404).send("You are not an admin or please check the username you have typed");
    }
});

// User routes
app.post('/users/signup', (req, res) => {
    let {username, password} = req.body;
    let existingUser = USERS.find((user) => user.username === username);
    if (existingUser) {
        res.status(400).send("User already exists");
    } else {
        USERS.push({username: username, password: password, purchasedCourse:[]});
        res.send("User created successfully");
    }
});

app.post('/users/login', (req, res) => {
    let {username, password} = req.headers;
    let existingUser = USERS.find((user) => user.username === username);
    if (existingUser) {
        if (existingUser.password === password) {
            res.send("Logged in successfully");
        } else {
            res.status(400).send("Incorrect password, please type correct password");
        }
    } else {
        res.status(404).send("Please sign up first");
    }
});

app.get('/users/courses', (req, res) => {
    let {username, password} = req.headers;
    let existingUser = USERS.find((user) => user.username === username);
    if (existingUser) {
        if (existingUser.password === password) {
            res.json({courses:COURSES});
        } else {
            res.status(400).send("Incorrect password, please type correct password");
        }
    } else {
        res.status(404).send("Please sign up first");
    }
});

app.post('/users/courses/:courseId', (req, res) => {
    let {username, password} = req.headers;
    let courseId= Number(req.params.courseId);
    let existingUser = USERS.find((user) => user.username === username);
    if (existingUser) {
        if (existingUser.password === password) {
            const course = COURSES.find(course=>course.courseId===courseId);
            existingUser.purchasedCourse.push(course);
            res.send("Course purchased successfully");
        } else {
            res.status(400).send("Incorrect password, please type correct password");
        }
    } else {
        res.status(404).send("Please sign up first");
    }
});

app.get('/users/purchasedCourses', (req, res) => {
    let {username, password} = req.headers;
    let existingUser = USERS.find((user) => user.username === username);
    if (existingUser) {
        if (existingUser.password === password) {
            res.json({purchasedCourses: existingUser.purchasedCourse});
        } else {
            res.status(400).send("Incorrect password, please type correct password");
        }
    } else {
        res.status(404).send("Please sign up first");
    }
});

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
