const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

require('dotenv').config();

const userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  loginHistory: [
    {
      dateTime: {
        type: Date,
        required: true,
      },
      userAgent: {
        type: String,
        required: true,
      },
    },
  ],
});

let User;

// Initialize function
function initialize() {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(process.env.MONGODB);
      
      db.on('error', (err) => {
          reject(err); // reject the promise with the provided error
      });
      db.once('open', () => {
          User = db.model("users", userSchema);
          resolve();
      });
  });
}

// Register User function
function registerUser(userData) {
  return new Promise(function (resolve, reject) {
      if (userData.password !== userData.password2) {
          reject("Passwords do not match");
      } else {
        bcrypt.hash(userData.password, 10).then( hash => {
          userData.password = hash;
          let newUser = new User(userData);
          newUser.save()
              .then(() => resolve())
              .catch((err) => {
                  if (err.code === 11000) {
                      reject("User Name already taken");
                  } else {
                      reject("There was an error creating the user: " + err);
                  }
              });
        })
      }
  });
}

// Check User function
function checkUser(userData) {
  return new Promise(function (resolve, reject) {
      User.find({ userName: userData.userName })
          .then((users) => {
              if (users.length === 0) {
                  reject("Unable to find user: " + userData.userName);
              } else {
                bcrypt.compare(userData.password, users[0].password)
                .then((result) => {
                  if (result) {
                    if (users[0].loginHistory.length === 8) {
                      users[0].loginHistory.pop();
                    }
                    users[0].loginHistory.unshift({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
                    User.updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } })
                        .then(() => resolve(users[0]))
                        .catch((err) => reject("There was an error verifying the user: " + err));
                    }
                    else{
                      reject("Incorrect Password for user: " + userData.userName);
                    }
                }).catch((err) => reject("There was an error verifying the user: " + err));
            }
          })
          .catch(() => reject("Unable to find user: " + userData.userName));
  });
}

// Export the functions
module.exports = {
  initialize: initialize,
  registerUser: registerUser,
  checkUser: checkUser
};