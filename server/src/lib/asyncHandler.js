// Wrap async route handlers so thrown/rejected errors reach the error middleware.
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
