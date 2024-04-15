const AppError = require('../utils/appError');

/**
 * A function to check if there were any runtime errors during development
 * @param {Error} err the received error
 * @param {Response} res response
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

/**
 * A function to check if there were any runtime errors during production
 * @param {Error} err the received error
 * @param {Response} res the response to send
 */
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    console.error('err');
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

/**
 * Function to handle application errors of type CastError
 * @param {Error} err
 * @returns an application error
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Function to handle application errors of type DuplicateField Error
 * @param {Error} err
 * @returns an application error
 */
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/);
  const message = `Duplicate field value: ${value}.please use another value`;
  return new AppError(message, 400);
};

/**
 * Function to handle application errors of type Validation Error
 * @param {Error} err
 * @returns an application error
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Function to handle application errors of type JSONWebToken Error
 * @returns an application error
 */
const handleJsonWebTokenError = () =>
  new AppError('Invalid token, please log in again', 401);

/**
 * Function to handle Expired JWT Error
 * @returns an application error
 */
const handleJWTExpiredError = () =>
  new AppError('Your token has expired, please login again', 401);

/**
 * A function to export all our error handlers based on the activities in the app
 * @param {Error} err error generated
 * @param {Request} req request sent
 * @param {Response} res response to send
 * @param {Function} next express next function
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  }

  if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }

    if (error.code === 1100) {
      error = handleDuplicateFieldsDB(error);
    }

    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }

    if (error.name === 'JsonWebTokenError') {
      error = handleJsonWebTokenError();
    }

    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }
    sendErrorProd(error, res);
  }
};
