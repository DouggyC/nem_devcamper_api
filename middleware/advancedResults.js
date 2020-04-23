const adavancedResults = (model, populate) => async (req,res,next) => {
  let query;

  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude, scrub from url query
  const removeFiles = ["select", "sort", "page", "limit"];

  // Loop over removeFields and delete them from reqQuery
  removeFiles.forEach((param) => delete reqQuery[param]);

  // console.log(reqQuery);

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Finding resource
  query = model.find(JSON.parse(queryStr))

  // Selected Fields
  if (req.query.select) {
    const fields = req.query.select.replace(",", " ");
    query = query.select(fields);
  }
  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.replace(",", " ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Populate
  if(populate) {
    query = query.populate(populate)
  }

  // Exec query
  // const bootcamps = await Bootcamp.find();
  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results
  }

  next()
}

module.exports = adavancedResults