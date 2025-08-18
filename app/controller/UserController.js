import User from "../config/db.js";
import { comparepassword, hashedpassword } from "../middleware/Auth.js";
import jwt from "jsonwebtoken";
import { sendEmailVerification } from "../helper/emailVerification.js";
import { sendResetPasswordMail } from "../helper/resetPasswordMail.js";

//create User
export const createUser = async (req, res) => {
  try {
    const { name, email, password, city } = req.body;
    if (!name || !email || !password || !city) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }
    const existingEmail = await User.query(
      `SELECT * FROM user_table WHERE email = ?`,
      [email]
    );
    if (existingEmail[0].email === email) {
      return res.status(400).json({
        status: false,
        message: "Email already exist.",
      });
    }

    const hashedPassword = await hashedpassword(password);
    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;

    const [data] = await User.query(
      `INSERT INTO user_table (name,email,password,image,city) VALUES(?,?,?,?,?)`,
      [name, email, hashedPassword, imagePath, city]
    );

    const insertId = data.insertId;
    if (!insertId) {
      return res.status(400).json({
        status: false,
        message: "Error occured while inserting data.",
      });
    }
    const [rows] = await User.query(`SELECT * FROM user_table WHERE id = ?`, [
      insertId,
    ]);
    const user = rows[0];
    await sendEmailVerification(req, user);
    return res.status(200).json({
      status: true,
      message: "User Created and Email sent successfully .",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//get User
export const getUsers = async (req, res) => {
  try {
    const [data] = await User.query(`SELECT * FROM user_table`);
    if (data.length === 0) {
      return res.status(400).json({
        status: false,
        message: "No data found.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Data fetched successfully.",
      total: data.length,
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//verifyOtp
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }
    //check if email exists
    const [emailExist] = await User.query(
      `SELECT email FROM user_table WHERE email = ?`,
      [email]
    );
    if (emailExist.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Email does not exist.",
      });
    }

    const [rows] = await User.query(
      `SELECT * FROM user_table WHERE email = ?`,
      [email]
    );
    const user = rows[0];

    //check is if user is verified
    if (user.is_verified === 1) {
      return res.status(400).json({
        status: false,
        message: "User is already verified.",
      });
    }

    //check otp entry
    const [emailVerfication] = await User.query(
      `SELECT * FROM otp_table WHERE user_id = ? AND otp = ?`,
      [user.id, otp]
    );

    // if otp does not match
    if (emailVerfication.length === 0) {
      await sendEmailVerification(req, user);
      return res.status(400).json({
        status: false,
        message: "Invalid OTP. New OTP has been sent to your email address.",
      });
    }

    //check expiration time
    const currentTime = new Date();
    console.log("Current Time", currentTime);
    const expirationTime = new Date(
      emailVerfication[0].created_at.getTime() + 15 * 60 * 1000
    );
    console.log("Expiration Time", expirationTime);

    if (currentTime > expirationTime) {
      await sendEmailVerification(req, user);
      return res.status(400).json({
        status: false,
        message: "OTP expired. New OTP has been sent to your mail.",
      });
    }

    //update isverified status
    const [updateVerificationStatus] = await User.query(
      `UPDATE user_table SET is_verified=? WHERE id =?`,
      [1, user.id]
    );
    if (updateVerificationStatus.changedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "Error occured while updating verification status.",
      });
    }
    //delete otp from the table after it is verified
    await User.query(`DELETE FROM otp_table WHERE user_id =?`, [user.id]);
    return res.status(200).json({
      status: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

//loginUser
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }
    const [rows] = await User.query(
      `SELECT * from user_table WHERE email = ?`,
      [email]
    );
    if (rows.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid Email .",
      });
    }
    const user = rows[0];
    const isMatch = await comparepassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Incorrect Password.",
      });
    }
    if (user.is_verified === 0) {
      return res.status(400).json({
        status: false,
        message: "Email is not verified.",
      });
    }
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        image: user.image,
      },
      process.env.SECRET_KEY,
      {
        expiresIn: "1h",
      }
    );
    return res.status(200).json({
      status: true,
      message: "Login Successful.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        city: user.city,
        image: user.image,
      },
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//dashboard
export const dashboard = async (req, res) => {
  try {
    const id = req.user.id;
    const [rows] = await User.query(`SELECT * FROM user_table WHERE id = ?`, [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(400).json({
        status: false,
        message: "User not found.",
      });
    }
    const user = rows[0];
    return res.status(200).json({
      status: true,
      message: "Welcome to the dashboard.",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        city: user.city,
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//reset-password-link
export const resetPasswordLink = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Email is required.",
      });
    }
    //finding user with email
    const [rows] = await User.query(
      `SELECT * FROM user_table WHERE email = ?`,
      [email]
    );
    if (rows.length === 0) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }
    const user = rows[0];

    //creating new token with unique secret key
    const secret = user.id + process.env.SECRET_KEY;
    const token = jwt.sign({ id: user.id }, secret, { expiresIn: "15m" });

    //generating link and sending mail
    let resetLink = `${process.env.FRONT_END_HOST}/account/reset/${user.id}/${token}`;
    console.log(resetLink);
    await sendResetPasswordMail(user, resetLink);

    return res.status(200).json({
      status: true,
      message: "Link to reset password has been sent successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

//reset password
export const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const { id, token } = req.params;

    //finding user with id
    const [rows] = await User.query(`SELECT * FROM user_table WHERE id=? `, [
      id,
    ]);
    if (rows.length === 0) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }
    const user = rows[0];

    //creating secret to verify the token
    const newSecret = user.id + process.env.SECRET_KEY;
    jwt.verify(token, newSecret);

    if (!password || !confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "Password and Confirm Password doesnot match.",
      });
    }
    //hasing password
    const hashPassword = await hashedpassword(password);

    const updatePassword = await User.query(`UPDATE user_table SET password = ? WHERE id = ?`,[hashPassword,user.id])

    if(updatePassword.changedRows===0){
      return res.status(400).json({
        status:false,
        message:'Error while updating password.'
      })
    }
    return res.status(200).json({
      status:true,
      message:'Password reset successful.'
    })

  } catch (error) {
    return res.status(400).json({
      status:false,
      message:error.message
    })
  }
};
