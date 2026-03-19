// Catches any error thrown with next(err) anywhere in the app
export const errorHandler = (err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  const status = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong'   // don't leak internals in production
    : err.message;

  res.status(status).json({ error: message });
};
