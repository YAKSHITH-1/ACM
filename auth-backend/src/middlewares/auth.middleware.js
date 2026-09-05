import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  // Support access token from Authorization header (preferred) or cookie
  let token;
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized"
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET
    );

    req.user = decoded;

    next();
  } catch (error) {
    // If header token failed but a cookie exists and differs, try cookie
    if (authHeader && req.cookies && req.cookies.accessToken && token !== req.cookies.accessToken) {
      try {
        const decodedCookie = jwt.verify(req.cookies.accessToken, process.env.JWT_ACCESS_SECRET);
        req.user = decodedCookie;
        return next();
      } catch (cookieErr) {}
    }
    return res.status(401).json({
      message: "Invalid token"
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }

    next();
  };
};