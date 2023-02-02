const User = require('../models/User')
const Note = require('../models/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')

/* @desc Get All Users */
/* @route GET /Users */
/* @access private */
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find().select('-password').lean()
    if (!users?.length) {
        return res.status(400).json({ message: 'No Users Found' })
    }
    res.json(users)
})

/* @desc create new user */
/* @route POST /Users */
/* @access private */
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body

    /*confrim Data */
    if (!username || !password || !Array.isArray(roles) || !roles.length) {
        return res.status(400).json({ message: 'All Fields are Required' })
    }

    /* Check for Dupliate */
    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate Username' })
    }

    /* Hash Password */
    const hashedPwd = await bcrypt.hash(password, 10) //salt rounds (hides and secures passwords)

    const userObject = { username, "password": hashedPwd, roles }

    /* create and store new user */
    const user = await User.create(userObject)
    if (user) { //created
        res.status(201).json({ message: `new user ${username} created successfully` })
    } else {
        res.status(400).json({ message: 'Invaild user data recieved' })
    }
})

/* @desc Update new user */
/* @route PATCH /Users */
/* @access private */
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body
    /* confrim data */
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean') {
        return res.status(400).json({ message: 'all fields are required' })
    }
    const user = await User.findById(id).exec()

    if (!user) {
        return res.status(400).json({ messgae: 'user not found' })
    }

    /* check for duplicates */
    const duplicate = await User.findOne({ username }).lean().exec()
    /*allow updates to original user */
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'duplicate username' })
    }

    user.username = username
    user.roles = roles
    user.active = active

    if (password) {
        //hash password
        user.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await user.save()

    res.json({ message: `${updatedUser.username} updated` })
})

/* @desc Delete new user */
/* @route DELETE /Users */
/* @access private */
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body
    if(!id){
        res.status(400).json({message:'User ID Required'})
    }

    const notes =await Note.findOne({ user: id }).lean().exec()
    if(notes?.length){
        res.status(400).json({message:'user has assigned notes'})
    }

    const user = await User.findById(id).exec();

    if(!user){
        return res.status(400).json({message:'user not found'})
    }

    const result = await user.deleteOne()

    const reply = `UserName ${result.username} with ID ${result._id} deleted`

    res.json(reply)
})

module.exports = {
    getAllUsers,
    createNewUser,
    updateUser,
    deleteUser
}