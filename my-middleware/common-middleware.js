function myMiddleWare(req, res, next) {
  next();
}

module.exports = {
  myMiddleWare,
};
