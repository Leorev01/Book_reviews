import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import pg from "pg";

//before running run node on terminal and install required packages

const app = express();
const port = 3000;

//database details
const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"book",
    password:"MynameisLeo123!",
    port: 5432
});

//connect to database
db.connect();

app.use(bodyParser.urlencoded({extended: true}));

//public file location
app.use(express.static("public"));

//function to add review
async function addReview(user_id,title,desc,notes, isbn, date, image){
    try{
        await db.query(`INSERT INTO reviews(user_id, title,description,notes,isbn, date, image)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`, [user_id,title,desc,notes, isbn, date, image]);
    }
    catch(err){
        console.log(err);
    }
    
}

//function to edit review
async function editReview(title, description, notes, isbn, image, id){
    try{
        await db.query(`UPDATE reviews
            SET title = $1, description = $2, notes = $3, isbn = $4, image = $5
            WHERE id = $6`,
           [title, description, notes, isbn, image, id]);
    }
    catch(err){
        console.log("Unable to edit review, "+err);
    }
}

//function to delete review
async function deleteReview(id){
    try{
        await db.query(`DELETE FROM reviews WHERE id = ${id}`);
    }
    catch(err){
        console.log("Unable to delete review, "+err);
    }
}

//function to get all reviews
async function getReviews(){
    try{
        let result = await db.query("SELECT * FROM reviews ORDER BY id DESC");
        return result;
    }
    catch(err){
        console.log("Unable to get reviews, "+err);
    }
}

async function getReview(id){
    try{
        let result = await db.query(`SELECT * FROM reviews WHERE id = ${id}`);
        return result.rows[0];
    }catch(err){
        console.log(err);
    }
}

//function to create user
async function createUser(name, email, password){
    try{
        await db.query("INSERT INTO users(name, email, password) VALUES ($1,$2,$3)",
            [name, email, password]
        )
    }
    catch(err){
        console.log("Unable to create user, "+err)
    }
}

//function to delete user
async function deleteUser(id){
    try{
        await db.query(`DELETE FROM users WHERE id = ${id}`);
    }
    catch(err){
        console.log("Unable to delete user, "+err);
    }
}

async function getImage(isbn){
    try{
        /*const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`);
        console.log(response.data);
        return JSON.parse(response.data);*/
        return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    }catch(err){
        console.log("Unable to generate image, "+err);
        return null;
    }

}

//let user;

//function to log in user
/*async function login(email, password){
    let passwordcheck = await db.query("SELECT password FROM users WHERE email = $1", 
        [email]
    );
    if(passwordcheck.rows[0] == password){
        let user =await db.query("SELECT * from users WHERE email = $1", [email]);
        Session(user) = user.rows[0]
    }
    else{
        console.log("User does not exist");
    } 
}*/

//load main page
app.get("/", async (req, res) => {
    let reviews = await getReviews();
    res.render("index.ejs", {
        reviews: reviews.rows
    });
})

//load individual review page
app.get("/review/:id", async (req,res) => {
    let id = req.params.id;
    let review = await getReview(id);
    res.render("reviews.ejs", {
        id:id,
        review: review
    });
})

//load login page
app.get("/login", (req,res) => {
    //login('leo@gmail.com', 'leo');
    res.render("login.ejs");
})

//load register page
app.get("/register", (req,res) => {
    res.render("register.ejs");
})

//add user
app.post("/register", async (req,res) => {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;
    try{
        await createUser(name, email, password);
        res.redirect("/");
    }
    catch(err){
        console.log(err);
    }
})

//login user
app.post("/login", async (req,res) => {

})

//add review
app.post("/addReview", async (req,res)=> {
    try{
        let notes;
        if(req.body.notes){
            notes = req.body.notes;
        }
        else{
            notes = "No notes";
        }
        //id placeholder
        let id = "1";
        let title = req.body.title;
        let desc = req.body.description;
        let isbn = req.body.isbn;
        let date = new Date(Date.now()).toDateString();
        let image = await getImage(isbn);
        await addReview(id,title,desc,notes, isbn, date, image);
        res.redirect("/");
    }
    catch(err){
        console.log("Unable to add review: "+err);
    }
})

//delete specific post
app.post("/delete/:id", (req,res) => {
    let id = req.params.id;
    console.log(id);
    try{
        deleteReview(id);
        res.redirect("/");
    }
    catch(err){
        console.log(err);
        let error = "Unable to delete post "+ err;
        res.redirect(`/review/${id}`, {
            error: error
        });
    }
})

//edit specific psot function
app.post("/edit/:id", async (req,res) => {
    let id = req.params.id;
    let title = req.body.title;
    let description = req.body.description;
    let notes = req.body.notes;
    let isbn = req.body.isbn;
    let image = await getImage(isbn);
    try{
        await editReview(title, description, notes, isbn, image, id);
        res.redirect(`/review/${id}`);
    }
    catch(err){
        console.log(err);
    }
})

app.listen(port, ()=> {
    console.log(`Listening on port ${port}`);
})