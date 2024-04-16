const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const sendEmail = require('./../utils/email');
const bcrypt = require('bcryptjs');

/**
 *
 * @param {String} id The user id gotten from mongoDB
 * @returns a signed jwt token
 */
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

/**
 * Function to create and send the jwt token in a https cookie
 * @param {object} user the current user
 * @param {Number} statusCode the status of the code of the response
 * @param {Response} res the response object itself
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),

    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

/**
 * asynchronous function to sign up users into the application
 * It's a normal express middleware function wrapped around the catchAsync to handle
 * any errors
 */
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

/**
 * asynchronous function to login users into the application
 * It's a normal express middleware function wrapped around the catchAsync to handle
 * any errors
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

/**
 * A simple express middleware function to check that the user is authenticated
 * by checking the authorization headers for the jwt token and decoding it to
 * get a valid user as well as an active token and then attach a user property to the request
 */
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in, please login to get access', 401),
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError('The user that has this token no longer exist', 401),
    );
  }

  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password!, please log in again', 401),
    );
  }

  req.user = freshUser;
  next();
});

// only for rendered pages, no error
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET,
    );

    const freshUser = await User.findById(decoded.id);

    if (!freshUser) {
      return next();
    }

    if (freshUser.changedPasswordAfter(decoded.iat)) {
      return next();
    }

    res.locals.user = freshUser;
    return next();
  }

  next();
});

/**
 * A function to return a middleware that checks if the user is authorized to visit a route
 * @param  {...any} roles this is the allowed roles type that can access the resource
 * @returns error or next depending on the user role
 */
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log(roles);
    // roles is an array ['admin', 'lead-guide' ...]
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this operation',
          403,
        ),
      );
    }
    next();
  };
};

/**
 * A simple express middleware function to handle the situation where the user foregts their password
 * It also sends an email to the user with the reset password url
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`;

  const message = `Forgot your password? Submit a request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token valid for 10 mins',
      message: message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending email', 500));
  }
});

/**
 * An express middleware function to handle the reset password request after user
 * follows the forgot password reset link
 * It also logs the user in after the password has been changed by sending a new jwt token
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  // get User based on the token

  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token: token,
  });
});

/**
 * A simple express middleware function to update user password if user is already logged in
 * updates the user password and relogs user in by sending a new jwt token
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  const currentUser = await User.findById(req.user.id).select('+password');

  const { prevPassword, password, passwordConfirm } = req.body;

  if (
    !(await currentUser.correctPassword(prevPassword, currentUser.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  currentUser.password = password;
  currentUser.passwordConfirm = passwordConfirm;

  await currentUser.save();

  const newToken = signToken(currentUser._id);
  res.status(200).json({
    status: 'success',
    token: newToken,
  });
});
