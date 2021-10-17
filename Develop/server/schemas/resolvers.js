const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if(context.user){
                const userData = await User.findOne({_id: context.user._id})
                .select('-password')
                return userData;
            }
            throw new AuthenticationError('Cannot find a user with this id!')
        }
    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
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
        saveBook: async(parent, args, context) => {
            if (context.user){

                const updatedUser = await User.findByIdAndUpdate(
                    {_id: context.user._id},
                    {$addToSet: {savedBook: args.input}},
                    {new: true}
                );
                return updatedUser;
            }
            throw new Error('You need to be logged in!');
        },
        removeBook: async(parent, args, context) => {
            if(context.user) {
                const updatedUser = await User.findOneAndDelete(
                    {_id: context.user._id},
                    {$push: {saveBook: {bookId: args.bookId}}},
                    {new: true}
                )
                return updatedUser;
            }
            throw new AuthenticationError("Can't remove the book");
        }
    }
};
module.exports = resolvers;