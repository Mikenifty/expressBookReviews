const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Check if the user with the given username and password exists
const authenticatedUser = (username, password) => {

  
      let validusers = users.filter((user) => {
          return (user.username === username && user.password === password);
      });
      // Return true if any valid user is found, otherwise false
      if (validusers.length > 0) {
          return true;
      } else {
          return false;
      }
    }   



//only registered users can login
regd_users.post("/login", (req,res) => {
  // Get the username and password from the http body
  const username = req.body.username;
  const password = req.body.password;
  // Check if username or password is missing
  if (!username || !password) {
      return res.status(404).send("Please enter your username and password.");
  }
  // Authenticate user
  if (authenticatedUser(username, password)) {
      // Generate JWT access token
      let accessToken = jwt.sign({
          data: password
      }, 'access', { expiresIn: 60 * 60 });
      // Store access token and username in session
      req.session.authorization = {
          accessToken, username
      }
      return res.status(200).send("Welcome " + username + ", you have successfully logged in!");
  } else {
      return res.status(208).send("Sorry, try again. Please check username and password.");
  }

});

// Add a book review
regd_users.put("/auth/review", (req, res) => {
  // Get the ISBN from the http request 
  const isbn = parseInt(req.query.isbn, 10);

//regd_users.put("/auth/review/:isbn", (req, res) => {
  // Get the ISBN from the http request 
  //const isbn = parseInt(req.params.isbn, 10);
  // Set the limits of the ISBN number
  const min = 0;
  const max = Object.keys(books).length + 1;

  if (min < isbn && isbn < max) {
    // Get the book corresponding to the submitted ISBN
    let revBook = books[Object.keys(books)[isbn]];
    // Get the reviewer's username from the session info
    let reviewer = req.session.authorization.username;
    // Get the user's review from the http body
    let myReview = req.query.myRev;
    //let myReview = req.body.myRev;


    if (myReview.length > 0) {
        // Add a username : review pair to the reviews object
        Object.assign(revBook.reviews, {[reviewer] : myReview} );  
        console.log(revBook.reviews);

        return res.send("The user " + reviewer + " added or changed a review of " + revBook.title + ".");
      } else {
        // Send a message if they didn't submit a review
        return res.send("Please submit a meaningful review.");
      };
  } else {
      // Ensure the submitted ISBN maps to an actual book
      return res.send("Please check the ISBN number.");
  };
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    // Get the ISBN from the http request 
    const isbn = parseInt(req.params.isbn, 10);
    // Set the limits of the ISBN number
    const min = 0;
    const max = Object.keys(books).length + 1;
    // Get the reviewer's username and the reviewed book
    let reviewer = req.session.authorization.username;
    let revBook = books[Object.keys(books)[isbn]];
    // Make sure the submitted ISBN is valid
    if (min < isbn && isbn < max) {
        // Delete the review with the given reviewer's name
        delete revBook.reviews[[reviewer]];
        // Send confirmation message
        res.send(reviewer + "'s review of " + revBook.title + " by " + revBook.author +" has been deleted.");
        console.log(revBook.reviews);
     }

});

module.exports.authenticated = regd_users;
module.exports.users = users;
