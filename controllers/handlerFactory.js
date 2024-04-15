const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

/**
 * A function to perform delete operation on any resource in the application
 * @param {Model} Model the particular model on which operation is to be carried out
 * @returns a json response upon completion or an error upon failure
 */
exports.deleteOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    res.status(204).json({
      status: 'success',
      data: null,
    });
    if (!doc) {
      return next(new AppError('No document found with that ID'));
    }
  });

/**
 * A function to perform update operation on any resource in the application
 * @param {Model} Model the particular model on which operation is to be carried out
 * @returns a json response upon completion or an error upon failure
 */
exports.updateOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('Document not available'));
    }
    res.status(200).json({
      status: 'success',
      data: {
        doc: doc,
      },
    });
  });

/**
 * A function to perform create operation on any resource in the application
 * @param {Model} Model the particular model on which operation is to be carried out
 * @returns a json response upon completion or an error upon failure
 */
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        doc: doc,
      },
    });
  });

/**
 * A function to perform find one operation on any resource in the application
 * @param {Model} Model the particular model on which operation is to be carried out
 * @returns a json response upon completion or an error upon failure
 */
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;

    if (!doc) {
      next(new AppError('No doc found with that id', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc: doc,
      },
    });
  });

/**
 * A function to perform find operation on any resource in the application
 * @param {Model} Model the particular model on which operation is to be carried out
 * @returns a json response upon completion or an error upon failure
 */
exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }
    // BUILD QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFileds()
      .paginate();

    const docs = await features.query;

    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        docs: docs,
      },
    });
  });
