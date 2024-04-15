/** these catches the error in any of the request made to our routes and 
 * sends it to the next which as far as this ap pis concerned is the appError
 * The appError object returns the appropriate error
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

module.exports = catchAsync;
