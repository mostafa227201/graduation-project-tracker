// Every error response has the same shape (see docs/api-contract.md):
//   { "error": { "code": "VALIDATION_ERROR", "message": "..." } }
function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

module.exports = { sendError };
