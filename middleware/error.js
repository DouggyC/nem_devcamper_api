const ErrorResponse = require('../utilis/errorResponse')

const errorHandler = (err, req, res, next) => {
  let error = { ...err }

  error.message = err.message

  // Log to console for dev
  // console.log(err)

  // Mongoose bad ObjectId
  if(err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`
    if(err.value == '[object Object]') {
      console.log(typeof '${err.value}')
    }
    error = new ErrorResponse(message, 404)
  }

  //  Mongoose validation error
  if(err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message)
    error = new ErrorResponse(message, 400)
  }

  // Mongoose duplicate key
  if(err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = new ErrorResponse(message, 400)
  }

  console.log(err.name.red.underline.bold)

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  })
}

module.exports = errorHandler

