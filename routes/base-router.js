const { Router } = require("express");
const {
  userController,
  mw_if_user_exists,
  multerUpload,
} = require("../controllers/user-controller");
const multer = require("multer");
const { myMiddleWare } = require("../my-middleware/common-middleware");

// const cors = require("cors");

const baseRouter = new Router();

//done // Маршрут для обновления профиля пользователя
baseRouter.put("/update", userController.updateProfile);

// done // Защищенный маршрут /account, доступный только авторизованному пользователю
baseRouter.post("/account", userController.account);

baseRouter.post("/login", mw_if_user_exists, userController.login);
baseRouter.get("/logout", userController.logOut);
baseRouter.post("/auth", userController.authorization);

baseRouter.post("/fuck", userController.fuckCheck);

// Маршрут для получения всех пользователей, кроме текущего
baseRouter.get("/people", userController.getPeople);

baseRouter.post("/registration", mw_bodyValidator, userController.registration);

baseRouter.post("/", userController.rootRoute);

baseRouter.post("/upload", multerUpload.single("image"), userController.upload);

module.exports = baseRouter;

function mw_bodyValidator(request, response, next) {
  next();
}

baseRouter.post("/hook", myMiddleWare, (req, res, next) => {
  const message = "hook message";

  setTimeout(() => {
    res.status(200).json({ message });
  }, 5000);
});
