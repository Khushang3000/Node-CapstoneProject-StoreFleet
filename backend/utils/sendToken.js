
export const sendToken = (user, res, statusCode) => { 
  const token = user.getJWTToken(); 


  const expiresInDays = parseInt(process.env.COOKIE_EXPIRES_IN, 10);
  if (isNaN(expiresInDays)) {
    console.error("COOKIE_EXPIRES_IN is not a valid number. Defaulting to 1 day.");
    
  }

  const cookieOptions = {
    expires: new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production", 
    sameSite: "strict", 
  };

  

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({ success: true, token, user }); 
};