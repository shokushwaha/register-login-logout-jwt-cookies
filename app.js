require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose')
const app = express();
const port = 3000
const url = process.env.URL
const cookieParser = require('cookie-parser')
const userModel = require('./models/Users')
const bcrypt = require('bcrypt');
const { createToken, verifyToken } = require('./middleware/jwt');

//middlewares
app.use(express.json());
app.use(cookieParser());

//database connection
mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true

}).then(() => {
    console.log(`connected to database`)
}).catch(err => console.log(err));

//requests
app.post('/register', async (req, res) => {

    if (!req.body.name || !req.body.password)
        return res.status(400).send({ message: `Fill all the credentials` });


    const hashedPwd = await bcrypt.hash(req.body.password, 10);
    try {
        const newUser = new userModel({ name: req.body.name, password: hashedPwd })
        await newUser.save();
        res.status(200).send(`User inserted successfully`);
    } catch (error) {

        res.status(400).send({ message: `Some error occured` });
    }

})


app.post('/login', async (req, res) => {
    const { name, password } = req.body;

    const user = await userModel.findOne({ name: name });

    if (!user) res.status(400).json({ error: "User Doesn't Exist" });

    bcrypt.compare(password, user.password).then((match) => {
        if (!match) {
            res
                .status(400)
                .json({ error: "Wrong Username and Password Combination!" });
        } else {
            const accessToken = createToken(user);

            res.cookie("access-token", accessToken, {
                maxAge: 60 * 60 * 24 * 30 * 1000,
                httpOnly: true,
            });

            res.json("LOGGED IN");
        }
    });

})

app.get('/data', verifyToken, (req, res) => {
    res.send({ message: `confidential data` });
})


app.delete('/logout', async (req, res) => {
    try {

        res.clearCookie('access-token');
        res.send({ message: `Logged Out` })
    } catch (error) {
        res.status(400).send({ message: err });
    }

})
//server connetion
app.listen(port, () => {
    console.log(`server is running`);
})