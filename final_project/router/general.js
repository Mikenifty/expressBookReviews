const express = require('express');
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

public_users.post("/register", (req,res) => {
  // get the username and password from the http request body
  const username = req.body.username;
  const password = req.body.password;

    // Check if a user with the given username already exists
    const doesExist = (username) => {
      // Filter the users array for any user with the same username
      let userswithsamename = users.filter((user) => {
          return user.username === username;
      });
      // Return true if any user with the same username is found, otherwise false
      if (userswithsamename.length > 0) {
          return true;
      } else {
          return false;
      }
    }

  // Check if both username and password are provided
  if (username && password) {
      // Check if the user has previously registered
      if (!doesExist(username)) {
          // Add the new user to the users array
          users.push({"username": username, "password": password});
          return res.status(200).send("New user " + username + " successfully registered. Please login now.");
      } else {
          return res.status(404).send("This user has already registered. Please login.");
      }
  }
  // Return error if username or password is missing
  return res.status(404).send("Unable to register user. Please provide a username and password.");

});

// Promise object accessing the database file
const getBooks = new Promise((resolve, reject) => {
      try {
             let books = require("./booksdb.js");
            //throw new Error("Don't stumble!");   // uncomment to test
            resolve(books);
       } catch  {
            reject("Database problem!")
            }  
         })

// Get the book list available in the shop
public_users.get('/books', async (req, res) => {  

    await getBooks    // Call the database function and do other things while waiting for its response

    .catch(
       (error) => console.log("Error occurred: " + JSON.stringify(error))
    ) 
    .then(
      (books) =>  res.status(200).send(JSON.stringify(books, null, 4))      // send back the requested data
    )   
});

// Get book details based on ISBN
public_users.get('/', async function (req, res) {      
    
    const isbn = parseInt(req.query.isbn, 10);    //access the isbn# passed in the http request query string and convert to type Integer
    if (0<isbn && isbn<11) {        // Check if ISBN is within acceptable range
    
        await getBooks    // call the database fct and do other things while waiting for its promise to resolve
        .then( 
                (books) => { 
                    return res.status(200).send(("ISBN: "+isbn+" ") + JSON.stringify(books[isbn]));  //send the requested book data back with isbn# upfront
                })
    } else { 
            return res.status(404).send("Invalid ISBN# input.");      // send back an error message
            }
 });
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {

      let reqAuthor = req.params.author;   //access the author passed in the parameters of the http request
      
      if (reqAuthor) {
        await getBooks      // call the database fct and do other things while waiting for its promise to resolve
            .then( (books) => {
                    let authorsBook = Object.values(books).filter((book) => {
                                        return book.author === reqAuthor;          // access the book with the requested author
                                        });
                    if (authorsBook.length > 0) {       // check that the book exists
                        return res.status(200).send(authorsBook);     // send back the requested data
                    } else {
                             return res.status(404).send("Please provide a valid author.");     // send back an error message
                            }    
                    })   
      }
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  
    await getBooks.then((books) => {            // call the database fct, do other things while waiting for its promise to resolve, and then begin action
      let reqTitle = req.params.title;          // access the title passed in the http request parameters
      let titledBook = Object.values(books).filter((book) => {
          return book.title === reqTitle;           // access the book with the quoted title
      })
      if (titledBook.length > 0) {                  // make sure the right book even exists
          return res.status(200).send(titledBook);     // send back the requested data
      } else {
          return res.status(404).send("Please provide a valid title.");       // send back an error message
      }
    })
});

//  Get book review
public_users.get('/review/:isbn', async (req, res) => {
      
    await getBooks.then((books)=>{          // call the database fct, wait for its promise to resolve, and begin action
      const isbn = parseInt(req.params.isbn, 10);           //access the isbn# passed in the http request parameters and convert to type Integer
      const min = 0;
      const max = Object.keys(books).length + 1;  //check that the provided isbn# is within valid range

      if (min < isbn && isbn < max) {
          let revBook = books[Object.keys(books)[isbn]];
          let revNum = Object.keys(revBook.reviews).length;

          if (revNum > 0) {         //check whether there are any reviews for this book
                return res.status(200).send("The book " + revBook.title + " has the following reviews: " + JSON.stringify(revBook.reviews));     // send back the requested data
          } else {
                return res.status(404).send("This book has no reviews yet.");     // send back an error message
                }
       } else {
             return res.status(404).send("Invalid ISBN# input.");     // send back an error message
             };
    })
});

module.exports.general = public_users;
