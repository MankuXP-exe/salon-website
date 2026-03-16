const { handleRequest } = require("../server");

module.exports = async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Server error");
  }
};
