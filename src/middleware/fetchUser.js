import jwt from "jsonwebtoken";

const fetchUser = async (req, res, next) => {
  try {
    const authToken = req.header("auth-token");
    if (!authToken) {
      return res
        .status(401)
        .send({ error: "Pls authenticate using a valid token" });
    }
    const data = await jwt.verify(authToken, process.env.JWT_SECRET);
    // Normalize user fields for downstream handlers
    req.user = { id: data.id };
    req.userId = data.id;
    next();
  } catch (error) {
    return res
      .status(401)
      .send({ error: "Pls authenticate using a valid token" });
  }
};

export { fetchUser };
