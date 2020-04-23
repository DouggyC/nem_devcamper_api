const crypto = require('crypto')
const ErrorResponse = require("../utilis/errorResponse");
const asyncHandler = require("../middleware/async");
const sendEmail = require('../utilis/sendEmail')
const User = require("../models/User");

// @desc          Register a User
// @route         POST api/v1/auth/register
// @access        Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create User
  const user = await User.create({ 
    name,
    email,
    password,
    role,
  });

  // // Create token
  // const token = user.getSignJwtToken();

  // res.status(200).json({
  //   success: true,
  //   token,
  // });

  sendTokenResponse(user, 200, res)
});

// @desc    Login User    |   @route    POST api/v1/auth/login   |   @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // Validate email & password
  if (!email || !password) next(new ErrorResponse("Please provide an email and password", 400));
  // Check for user
  const user = await User.findOne({ email }).select("+password");
  if (!user) next(new ErrorResponse("Invalid credentials", 401));

  // Check if password matches
  const isMatch = await user.matchPassword(password) ? user.matchPassword(password) : next(new ErrorResponse("Invalid credentials", 401))
  // if (!isMatch) next(new ErrorResponse("Invalid credentials", 401));

  // // Create token
  // const token = user.getSignJwtToken();

  // res.status(200).json({
  //   success: true,
  //   token,
  // });

  sendTokenResponse(user, 200, res)
});

// @desc          Get current logged in User
// @route         POST api/v1/auth/me
// @access        Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    data: user
  })
})

// @desc     Forgot password   |   @route    POST api/v1/auth/forgotpassword   |   @access    Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({email: req.body.email })

  if(!user) {
    return next(new ErrorResponse('Email does not exists', 404))
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken()

  await user.save({ validBeforeSave: false })

  // Create reset url
  const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/resetpassword/${resetToken}`

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    })

    res.status(200).json({
      success: true, 
      data: "Email sent", 
      user
    })
  } catch (err) {
    console.error(err)
    user.getResetPasswordToken = undefined
    user.getResetPasswordExpire = undefined

    await user.save({ validateBeforeSave: true })

    return next(new ErrorResponse('Email could not be sent', 500))
  }
  // res.status(200).json({ success: true, data: user })
})

// @desc     Reset password   |   @route    PUT api/v1/auth/resetpassword:resettoken   |   @access    Public
exports.resetPassword = asyncHandler( async (req, res, next) => {
  // Get hashed token
  // const resetPass

  // const user = await User.findById(req.user.id)


})


// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignJwtToken();

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  }

  if(process.env.NODE_ENV === 'production') {
    options.secure = true
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({ 
      success: true,
      token
    })
}