const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

app.use(express.json());

const adminSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    imageLink: String,
    published: Boolean
});

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }]
});

// Create a model for the collection
const User = mongoose.model('User', userSchema);
const Admin = mongoose.model('Admin', adminSchema);
const Course = mongoose.model('Course', courseSchema);

function generateTokenForAdmin(username, password) {
    return jwt.sign({username: username, password: password}, "AdminSecret", {expiresIn: '1h'});
}

function generateTokenForUser(username, password) {
    return jwt.sign({username: username, password: password}, "UserSecret");
}

async function checkAdmin(req, res, next) {
    const {username, password} = req.body;
    const adminUser = await Admin.findOne({username});
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

async function checkUser(req, res, next) {
    const {username, password} = req.body;
    const user = await User.findOne({username});
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

mongoose.connect('mongodb+srv://sushilofficial:Hakuna%40123@cluster0.u91nm26.mongodb.net/courses', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "courses"
});
// mongoose.connect('mongodb+srv://sushilofficial:Hakuna@123@cluster0.u91nm26.mongodb.net/courses?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
// Admin routes
app.post('/admin/signup', async (req, res) => {
    const {username, password} = req.body;
    const adminUser = await Admin.findOne({username});
    if (adminUser) {
        res.status(400).send("You are already an admin");
    } else {
        const token = generateTokenForAdmin(username, password);
        const admin = new Admin({username, password});
        await admin.save();
        res.json({message: "Admin created successfully", token: token});
    }
});

app.post('/admin/login', checkAdmin, (req, res) => {
    const {username, password} = req.body;
    const token = generateTokenForAdmin(username, password);
    res.json({message: "Logged in successfully", token: token});
});

app.post('/admin/courses', verifyAdminToken, async (req, res) => {
    const payload = req.body;
    const course = new Course(payload);
    await course.save();
    res.json({message: "Course created successfully", courseId: course.id});
});

app.put('/admin/courses/:courseId', verifyAdminToken, async (req, res) => {
    const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {new: true});
    if (course) {
        res.send("Course updated successfully");
    } else {
        res.status(404).json({message: 'Course not found'});
    }
});

app.get('/admin/courses', verifyAdminToken, async (req, res) => {
    const course = await Course.find();
    res.json({courses: course});
});

// User routes
app.post('/users/signup', async (req, res) => {
    const {username, password} = req.body;
    const user = await User.findOne({username: username});
    if (user) {
        res.status(400).send("You have already signed up, please sign in!");
    } else {
        const token = generateTokenForUser(username, password);
        const user1 = new User({...req.body, purchasedCourses: []});
        await user1.save();
        res.json({message: "User created successfully", token: token});
    }
});

app.post('/users/login', checkUser, (req, res) => {
    const {username, password} = req.body;
    const token = generateTokenForUser(username, password);
    res.json({message: "Logged in successfully", token: token});
});

app.get('/users/courses', async (req, res) => {
    const courses = await Course.find();
    return res.json({courses: courses});
});

app.post('/users/courses/:courseId', verifyUserToken, async (req, res) => {
    const course = await Course.findById(req.params.courseId);
    console.log(course);
    if (course) {
        const user = await User.findOne({ username: req.userCredentials.username });
        console.log(user);
        if (user) {
            user.purchasedCourses.push(course);
            await user.save();
            res.json({ message: 'Course purchased successfully' });
        } else {
            res.status(403).json({ message: 'User not found' });
        }
    } else {
        res.status(404).json({ message: 'Course not found' });
    }
});

app.get('/users/purchasedCourses', verifyUserToken, async (req, res) => {
    const user = await User.findOne({username: req.userCredentials.username}).populate('purchasedCourses');
    res.json({purchasedCourses: user.purchasedCourses});
});

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
