const {User}  = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');


const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      // if user has been added to req by authMiddleware, user will be validated
      if (context.user) {
        const userData = await User.findOne({_id: context.user._id})
          .select('-__v -password')          
        return userData;
      }

      throw new AuthenticationError('Not logged in');
    }, 
  
    users: async () => {
      return User.find()
    },
  },

  Mutation: {
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials')
      }

      // if password is correct, sign token and return token and user
      const token = signToken(user);
      return { token, user }
    },

    addUser: async (parent, args) => {
      const user = await User.create(args);
      // sign a token and combine token with the user data
      const token = signToken(user);

      return { token, user }
    },

    saveBook: async (parent, { book }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          {_id: context.user._id},
          { $addToSet: { savedBooks: book}},         
          { new: true, runValidators: true }
        )
        // console.log(updatedUser);
        return updatedUser;
      }

      throw new AuthenticationError('You need to be loggedin to save a book');
    }, 

    removeBook: async (parent, { bookId }, context) => {
      // console.log("bookId: ", bookId)
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          {_id: context.user._id},
          // not sure...
          { $pull: { savedBooks: { bookId: bookId } } },
          { new: true }
        )
        
        return updatedUser;
      }

      throw new AuthenticationError('You need to be logged in')
    }
  }
}

module.exports = resolvers;