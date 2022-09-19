const express = require("express");
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken')
const cors = require("cors");
const exec = require('child_process').exec
const iconvlite = require('iconv-lite');
const utils = require('./app/utils/utils')
const {accessTokenSecret, refreshTokenSecret, accessTokenExpires} = require('./app/config/authConfig')


const app = express();
app.use(bodyParser.json());
app.use(cors(corsOptions));
var corsOptions = {
  origin: '*'
};



const Pool = require('pg').Pool;
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST  ||'localhost',
  database: process.env.DB_DATABASE || 'api',
  password: process.env.DB_PASSWORD||'',
  port: process.env.DB_PORT || 5432,
});

const geterateAccessToken = id => {
    return {accessToken: jwt.sign({ username: id}, accessTokenSecret, { expiresIn: accessTokenExpires }),
            refreshToken: jwt.sign({ username: id}, refreshTokenSecret)}
}
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        try {
            const token = authHeader.split(' ')[1];
            const userTokens = await pool.query('SELECT * FROM tokens WHERE accesstoken = $1 AND refreshtoken IS NOT NULL', [token])
            
            const exp = userTokens.rows && userTokens.rows[0].accesstokendate
            if (exp) {
                new Error('Не забанен ли пользователь')
            }
            const ignoreExp = exp.getTime() >= new Date().getTime()
            console.log(ignoreExp)
            if (ignoreExp) {
                const newExpirationDate = utils.addMinutes(accessTokenExpires)
                await pool.query('UPDATE tokens SET accesstokendate = $1 WHERE accesstoken = $2 AND refreshtoken IS NOT NULL',
                [newExpirationDate, token])
            }
            jwt.verify(token, accessTokenSecret, {ignoreExpiration: ignoreExp}, (err, decode) => {
                if (err) {
                    return res.sendStatus(403);
                }
                req.user = decode;
                req.userToken = token;
                next();
            });
        } catch (e) {
            res.send(e.message)
        }
    } else {
        res.sendStatus(401);
    }
}

app.post('/signup', async (req, res) => {
    try {
        const { id, password } = req.body
        // Можно проверить регуляркой относительно того является ли строка телефоном или mail
        const userNotExists = await pool.query('SELECT * FROM users WHERE id = $1', [id])
        if (userNotExists.rowCount) {
            throw new Error('Пользователь существует')
        }
        // Можно было и boolean сделать - но может еще какие варианты будут в теории
        const idType = utils.validateEmail(id) ? 'email' : 'phone'
        const newUser = await pool.query('INSERT INTO users (id, password, idtype) VALUES ($1, $2, $3) RETURNING *', [id, password, idType])
        const {accessToken, refreshToken,} = geterateAccessToken(newUser.rows[0].id)
        const newExpirationDate = utils.addMinutes(accessTokenExpires)    
        await pool.query('INSERT INTO tokens (id, accesstoken, accesstokendate, refreshtoken) VALUES ($1, $2, $3, $4) RETURNING *',
        [id, accessToken, newExpirationDate ,refreshToken])
        res.status(201).send({accessToken})
    } catch(e) {
            res.status(400).send(e.message)
    }
    })

app.post('/signin', async (req, res) => {
    try {
        const { id, password } = req.body;
        if (!id || !password) {
            throw new Error('Проверьте параметры')
        }
        const user = await pool.query('SELECT * FROM users WHERE id = $1 AND password = $2', [id, password])
        if(!user.rowCount) throw new Error('Проверьте правильность логина и пароля')
        if (user) {
            const {accessToken, refreshToken} = geterateAccessToken(user.rows[0].id)
            const newExpirationDate = utils.addMinutes(accessTokenExpires)
            await pool.query('INSERT INTO tokens (id, accesstoken, accesstokendate, refreshtoken) VALUES ($1, $2, $3, $4) RETURNING *', [id, accessToken, newExpirationDate ,refreshToken])
            res.json({
                accessToken,
            });
        } else {
            res.send(401);
        }
 } catch(e) {
    res.status(400).send(e.message)
 }
});

app.get('/info', authenticateJWT, async (req, res) => {
    try {
        const userInfo = await pool.query('SELECT id, idtype FROM users WHERE id = $1', [req.user.username])
        res.json(userInfo.rows[0])
    } catch(e) {
        console.log(e)
        res.sendStatus(403);
    }
})

app.get('/latency', authenticateJWT, async (req, res) => {
    //TODO проверить в каком виде будет отдавать на unix системах
    try {
        const ping = await exec('ping google.com', { encoding: 'binary' }, (err, stdout, stderr) => {
          if (err) {
            throw err;
          }
          const encodedData = iconvlite.encode(iconvlite.decode(stdout, 'cp866'), 'utf8')
          res.status(200).send(encodedData)
        });
      } catch (e) {
        res.status(400).json({ message: e.message });
      }
})
app.get('/logout', authenticateJWT, async (req, res) => {
    try {
        if (Object.keys(req.query).length == 0) throw new Error('Проверьте параметры')
        console.log(JSON.parse(req.query.all))
        const query = JSON.parse(req.query.all) ? {text: 'DELETE FROM tokens WHERE id = $1;',values: [req.user.username]}
        : {text: 'DELETE FROM tokens WHERE id = $1 AND accesstoken = $2;', values: [req.user.username, req.userToken]}
        await pool.query(query)
        res.send(req.query)
    } catch(e) {
        res.status(400).send(e.message) 
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});