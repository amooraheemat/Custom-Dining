const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'SequelizeValidationError') {
    const seenFields = new Set();
    const formattedErrors = [];

    for (const e of err.errors) {
      if (!seenFields.has(e.path)) {
        formattedErrors.push({
          field: e.path,
          message: e.message
        });
        seenFields.add(e.path);
      }
    }

    return res.status(400).json({
      status: 'error',
      message: 'Validation error',
      errors: formattedErrors
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      status: 'error',
      message: 'Record already exists',
      errors: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
};

export default errorHandler;