const { ObjectId } = require("mongodb");
const User = require("../database/model/model");
var jwt = require("jsonwebtoken");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}--${file.originalname}`);
  },
});

const multerUpload = multer({ storage: storage });

class UserController {
  async registration(request, response, next) {
    const result = await handler_registration(request, response);

    if (result.status) {
      response.status(200).json(result);
    } else {
      response.status(409).json(result);
    }
  }



  // done
  async login(request, response, next) {
    if (request.user.access_token) {
      console.log("token exists");

      const token = request.user.access_token;
      const splited = token.split(".");

      response.status(200).json({
        auth: true,
        token: [splited[0], splited[1]].join("."),
        userid: request.user._id,
        message: "you authorized",
      });
    } else {
      console.log("new token");

      const access_token = jwt.sign(
        JSON.stringify({ userID: request.user_id }),
        process.env.secret_key,
      );

      request.user.access_token = access_token;
      await request.user.save();

      const splitted = access_token.split(".");

      response.status(200).json({
        auth: true,
        token: [splitted[0], splitted[1]].join("."),
        userid: request.user._id,
        message: "you token was created, and u auth",
      });
    }
  }

  // done
  async logOut(request, response, next) {
    const result = await logOutHandler(request, response);
  }

  // done
  async getPeople(request, response, next) {

    const users = await User.find();

    const data = users.map(elem => {
      
      const {name , password , email , gender , id} = elem ;
      
      return {name , id , password , email , gender}
    });

    response.status(200).json(data);
  }

  async test(request, response, next) {
    response.status(200).json("test response");
  }

  async rootRoute(request, response, next) {
    response.status(200).json("test response");
  }

  async account(request, response, next) {
    console.log("request.body", request.body);

    const requestToken = request.body.token;
    const requestUserID = request.body.userid;

    const result = await checkUserByTokenAndUUID(requestToken, requestUserID);

    if (result.status) {
      response.status(200).json({
        auth: true,
        payload: {
          name: result.payload.name,
          password: result.payload.password,
        },
        message: "okay",
      });
    } else {
      response
        .status(200)
        .json({ auth: false, payload: {}, message: result.message });
    }
  }

  async updateProfile(request, response, next) {
    const body = request.body;

    const requestToken = body.token;
    const requestID = body.userid;
    const nameToUpdate = body.payload.name;
    const passwordToUpdate = body.payload.password;

    if (
      nameToUpdate === "" ||
      nameToUpdate === undefined ||
      passwordToUpdate === "" ||
      passwordToUpdate === undefined
    ) {
      await response
        .status(200)
        .json({ auth: true, message: "you have empty spaces" });
      return;
    }

    const result = await checkUserByTokenAndUUID(requestToken, requestID);

    if (result.status) {
      const updateResult = await User.findByIdAndUpdate(
        { _id: result.payload._id },
        { name: nameToUpdate, password: passwordToUpdate },
        { new: true },
      );

      console.log(updateResult.name, updateResult.password);

      response.status(200).json({ auth: true, message: updateResult });
    } else {
      response.status(200).json({ auth: false, message: "sorry" });
    }
  }

  async fuckCheck(request, response, next) {
    const user = await User.findById("6613b0d364794ad6eaf55291");

    response.status(200).json(user);
  }

  // in process...
  async authorization(request, response, next) {
    const data = request.body;

    if (data.token) {
      if (data.userid) {
        const candidate = await User.findById(data.userid);

        if (candidate) {
          const candidate_access_token = candidate.access_token;
          const candidate_access_token_secret =
            candidate_access_token.split(".")[2];

          const tokenFromClient = data.token;

          const testToken = [
            ...tokenFromClient.split("."),
            candidate_access_token_secret,
          ].join(".");

          // проверка токена
          try {
            jwt.verify(testToken, process.env.secret_key, (error, decoded) => {
              if (error) {
                response
                  .status(409)
                  .json({ auth: false, message: "the tokens do not match" });
              } else {
                if (decoded) {
                  if (decoded.userID) {
                    if (candidate._id.toString() === decoded.userID) {
                      response.status(200).json({
                        auth: true,
                        message: "access is allowed , the userID match",
                      });
                    } else {
                      response.status(409).json({
                        auth: false,
                        message: "access denied , the userID dont match",
                      });
                    }
                  } else {
                    response.status(409).json({
                      auth: false,
                      message: "token have not contains userID",
                    });
                  }
                } else {
                  response.status(409).json({
                    auth: false,
                    message: "token have not useful information",
                  });
                }
              }
            });
          } catch (err) {
            console.log("error: ", err);
          }
        } else {
          response.status(409).json({ auth: false, message: "access denied" });
        }
      } else {
        response.status(200).json({
          auth: false,
          message: "you have no user ID",
        });
      }
    } else {
      console.log("data.token", data.token);
      response.status(200).json({ auth: false, message: "you have no token" });
    }
  }

  async upload(request, response, next) {
    console.log(request.file.path);

    if (
      (() => {
        const uid = request.headers["x-user-id"];
        const token = request.headers.authorization.split(" ")[1];

        if (!token) return { status: false, message: "no token" };
        if (!uid) return { status: false, message: "no uid" };

        return { status: true, message: "OK" };
      })().status
    ) {
      response.status(200).json(JSON.stringify(request.file));
    } else {
      response.status(200).json(JSON.stringify("no uid or token"));
    }
  }
}

async function handler_registration(request, response) {
  const body = request.body;

  const { email, name } = body;

  if (email && name) {
    const userDocument = await User.findOne({ $or: [{ email }, { name }] });

    if (!userDocument) {

      const secret = process.env.secret_key ;

      if(!secret) {
        return {status:false , message:'no env secret key'}
      }

      // create new user with secret key
      const newUser = new User({ ...body, secret });
      const saved = await newUser.save();

      const access_token = JWT_token_generation({ user_id: saved._id });

      // add access token by userID
      saved.access_token = access_token;
      const savedWithToken = await saved.save();

      return {status:true , message:'user has registered'};
    } else {
      return {status:false , message:'user has NOT registered'};
    }
  }
}

async function logOutHandler(request, response) {
  response.status(200).json({ auth: false });
}

async function upload(request, response) {
  response.status().json({ message: "hello from uploader" });
}

// middle-ware

async function mw_if_user_exists(request, response, next) {
  const body = request.body;

  if (body) {
    const { email, password } = body;

    const ifUserExist = await User.findOne({
      email: { $eq: email },
      password: { $eq: password },
    }).catch((error) => {
      console.log(error);
    });

    if (ifUserExist) {
      // проверка есть ли токен доступа

      request.user = ifUserExist;
      next();
    } else {
      response
        .status(409)
        .json({ auth: false, message: "sorry u email or password wrong" });
    }
  } else {
    response
      .status(409)
      .json({ auth: false, message: "sorry you send empty data" });
  }
}

function JWT_token_generation(payload) {
  const accessToken = jwt.sign(JSON.stringify(payload), process.env.secret_key);

  return accessToken;
}

const userController = new UserController();

// userController.login

module.exports = {
  userController,
  mw_if_user_exists,
  multerUpload,
};

async function checkUserByTokenAndUUID(requestToken, requestUserID) {
  if (!requestToken) {
    return { status: false, payload: null, message: "no token" };
  }

  if (!requestUserID) {
    return { status: false, payload: null, message: "no uuid" };
  }

  const userByID = await User.findById(requestUserID);

  if (!userByID) {
    return { status: false, payload: null, message: "have no user by ID" };
  }

  const userToken = userByID.access_token;
  const userSecretKey = userByID.secret_key;

  if (!userToken) {
    return { status: false, payload: null, message: "NO TOKEN ".repeat(10) };
  } else {
    const userTokenSecretKeyPart = userToken.split(".")[2];

    // compile test token
    const testToken = [...requestToken.split("."), userTokenSecretKeyPart].join(
      ".",
    );

    try {
      const decodedJWT = jwt.verify(testToken, userSecretKey);

      if (decodedJWT) {
        if (userByID._id.toString() === decodedJWT.userID) {
          // response.status(200).json({auth:true , payload:{name , password} , message:'its okay '.repeat(100)});

          return {
            status: true,
            payload: userByID,
            message: "its okay ".repeat(100),
          };
        } else {
          // response.status(200).json({auth:false  , message:'no match data result '.repeat(10)});
          return {
            status: false,
            payload: null,
            message: "no match data result ".repeat(10),
          };
        }
      } else {
        return {
          status: false,
          payload: null,
          message: "no useful data on the token",
        };
      }
    } catch (error) {
      return { status: false, payload: null, message: "sorry token is wrong" };
    }
  }
}
