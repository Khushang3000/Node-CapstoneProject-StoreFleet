// backend/utils/sendToken.js
// create token and save into cookie

export const sendToken = (user, res, statusCode) => { // Made non-async as getJWTToken is likely synchronous
  const token = user.getJWTToken(); // Assuming user.getJWTToken() is synchronous

  // Ensure COOKIE_EXPIRES_IN is a number
  const expiresInDays = parseInt(process.env.COOKIE_EXPIRES_IN, 10);
  if (isNaN(expiresInDays)) {
    console.error("COOKIE_EXPIRES_IN is not a valid number. Defaulting to 1 day.");
    // Optionally throw an error or use a default
  }

  const cookieOptions = {
    expires: new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
    secure: process.env.NODE_ENV === "production", // Send cookie only over HTTPS in production
    sameSite: "strict", // Helps prevent CSRF attacks. Use 'lax' if 'strict' causes issues with cross-site navigation.
  };

  // It's common to not send the full user object back, or at least strip sensitive data.
  // This should ideally be handled by a toJSON method in the User schema or by selecting fields.
  // For example:
  // const { password, resetPasswordToken, resetPasswordExpire, ...userData } = user.toObject ? user.toObject() : user;
  // For now, sending the user object as received.

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({ success: true, token, user }); // Typically, the token is primary, user data can be selective
};