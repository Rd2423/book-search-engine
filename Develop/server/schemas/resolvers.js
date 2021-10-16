const { AuthenticationError } = require('apollo-server-express');
const { createUser } = require('../controllers/user-controller');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if(context.user){
                const foundUser = await User.findOne({_id: context.user._id})
                .select('-password')
                return foundUser;
            }
            throw new AuthenticationError('Cannot find a user with this id!')
        }
    },

    Mutation: {
        addUser: async (parent,{username, email, password}) => {
            const user = await User.create(username, email, password);
            const token = signToken(user);
            return { token, user }
        },
        login: async(parent, {email, password }) => {
            const user = await User.findOne({ email });

            if(!user) {
                throw new AuthenticationError('Incorrect credentials')
            }
            const correctPw = await user.isCorrectPassword(password);

            if(!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);
            return { token, user };
        },
        saveBook: async(parent, {authors, description, title, bookId, image, link}, context) => {
            if (context.user){

                const savedBook = await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    {$push: {savedBooks: authors, description, title, bookId, image, link}},
                    {new: true}
                );
                return savedBook;
            }
            throw new Error('You need to be logged in!');
        },
        removeBook: async({bookId}, context) => {
            if(context.user) {
                const deletedBook = await Book.findByIdAndDelete(
                    {_id: bookId},
                    {$push: {saveBook: {bookId}}},
                    {new: true}
                )
                return deletedBook;
            }
            throw new Error("Can't remove the book");
        }
    }
};
module.exports = resolvers;