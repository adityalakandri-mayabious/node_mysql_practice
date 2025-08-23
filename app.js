import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import mySqlPool from './app/config/db.js';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import UserRoute from './app/routes/UserRouter.js';
import CategoryRoute from './app/routes/CategoryRouter.js'
import BlogRoute from './app/routes/BlogRouter.js'
import BlogImageRoute from './app/routes/BlogImageRouter.js'
import CommentRoute from './app/routes/CommentRouter.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// morgan setup
app.use(morgan('dev'));

// body parser
// app.use(bodyparser.json());
// app.use(bodyparser.urlencoded())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// setting view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

// static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 


//routes
app.use(UserRoute);
app.use(CategoryRoute);
app.use(BlogRoute);
app.use(BlogImageRoute);
app.use(CommentRoute);

// post listening and db connection
const port = process.env.port || 3009;

mySqlPool.query('SELECT 1')
  .then(() => {
    console.log("MySQL Connected.");
    app.listen(port, () => {
      console.log(`Server is running at port: ${port}`);
    });
  })
  .catch((error) => {
    console.error(error.message);
    throw error;
  });
