import User from "../config/db.js";
import { comparepassword, hashedpassword } from "../middleware/Auth.js";
import jwt from "jsonwebtoken";
import { sendEmailVerification } from "../helper/emailVerification.js";
import { sendResetPasswordMail } from "../helper/resetPasswordMail.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { title } from "process";

//create User
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role = "user", city } = req.body;
    console.log(req.body);
    if (!name || !email || !password || !city) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }
    //check existing mail
    const [existingEmail] = await User.query(
      `SELECT * FROM user_table WHERE email = ?`,
      [email]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Email already exist.",
      });
    }

    //hash password
    const hashedPassword = await hashedpassword(password);
    const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : null;

    const is_verified = role === "admin";

    const [data] = await User.query(
      `INSERT INTO user_table (name,email,password,role,image,city,is_verified) VALUES(?,?,?,?,?,?,?)`,
      [name, email, hashedPassword, role, imagePath, city, is_verified]
    );

    const insertId = data.insertId;
    if (!insertId) {
      return res.status(400).json({
        status: false,
        message: "Error occured while inserting data.",
      });
    }
    //fetching inserted data
    const [user] = await User.query(`SELECT * FROM user_table WHERE id = ?`, [
      insertId,
    ]);

    //send mail if not admin
    if (role !== "admin") {
      await sendEmailVerification(req, user);
    }
    return res.status(200).json({
      status: true,
      message:
        role === "admin"
          ? "Admin created successfully"
          : "User created and mail sent successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error,
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

    const [user] = await User.query(
      `SELECT * FROM user_table WHERE email = ?`,
      [email]
    );
    console.log("From verify otp", user);

    //check if user is verified
    if (user[0].is_verified === 1) {
      return res.status(400).json({
        status: false,
        message: "User is already verified.",
      });
    }

    //check otp entry
    const [emailVerfication] = await User.query(
      `SELECT * FROM otp_table WHERE user_id = ? AND otp = ?`,
      [user[0].id, otp]
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
    const expirationTime = new Date(
      emailVerfication[0].created_at.getTime() + 15 * 60 * 1000
    );

    if (currentTime > expirationTime) {
      await sendEmailVerification(req, user);
      return res.status(400).json({
        status: false,
        message: "OTP expired. New OTP has been sent to your mail.",
      });
    }

    //update isverified status
    const [updateVerificationStatus] = await User.query(
      `UPDATE user_table SET is_verified = ? WHERE id =?`,
      [1, user[0].id]
    );
    console.log("from updateVerificationStatus", updateVerificationStatus);
    if (updateVerificationStatus.changedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "Error occured while updating verification status.",
      });
    }
    //delete otp from the table after it is verified
    await User.query(`DELETE FROM otp_table WHERE user_id =?`, [user[0].id]);
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
    const [user] = await User.query(
      `SELECT * from user_table WHERE email = ?`,
      [email]
    );
    const userData = user[0];
    if (user.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Invalid Email .",
      });
    }
    const isMatch = await comparepassword(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Incorrect Password.",
      });
    }
    if (userData.is_verified === 0) {
      return res.status(400).json({
        status: false,
        message: "Email is not verified.",
      });
    }
    const payload = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      city: userData.city,
      image: userData.image,
      role: userData.role,
    };
    const token = jwt.sign(payload, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    return res.status(200).json({
      status: true,
      message: "Login Successful.",
      data: payload,
      token: token,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error,
    });
  }
};

//dashboard
export const dashboard = async (req, res) => {
  try {
    const id = req.user.id;
    const [user] = await User.query(`SELECT * FROM user_table WHERE id = ?`, [
      id,
    ]);
    if (user.length === 0) {
      return res.status(400).json({
        status: false,
        message: "User not found.",
      });
    }

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
    const [user] = await User.query(
      `SELECT * FROM user_table WHERE email = ?`,
      [email]
    );
    if (user.length === 0) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }

    //creating new token with unique secret key
    const secret = user[0].id + process.env.SECRET_KEY;
    const token = jwt.sign({ id: user[0].id }, secret, { expiresIn: "15m" });

    //generating link and sending mail
    let resetLink = `${process.env.FRONT_END_HOST}/account/reset/${user[0].id}/${token}`;
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
    const [user] = await User.query(`SELECT * FROM user_table WHERE id=? `, [
      id,
    ]);
    if (user.length === 0) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }

    //creating secret to verify the token
    const newSecret = user[0].id + process.env.SECRET_KEY;
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

    const [updatePassword] = await User.query(
      `UPDATE user_table SET password = ? WHERE id = ?`,
      [hashPassword, user[0].id]
    );

    if (updatePassword.changedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "Error while updating password.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

//edit profile
export const editProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [user] = await User.query(`SELECT * FROM user_table WHERE id = ?`, [
      userId,
    ]);
    if (userId.toString() !== id) {
      return res.status(400).json({
        status: false,
        message: "You are not authoriesd to do this operation.",
      });
    }
    if (user.length === 0) {
      return res.status(400).json({
        status: false,
        message: "User not found",
      });
    }
    return res.status(200).json({
      status: true,
      message: "User details fetched successfully.",
      data: user,
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

//update profile
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, image, city } = req.body;

    const [user] = await User.query(`SELECT * FROM user_table WHERE id = ?`, [
      id,
    ]);
    if (userId.toString() !== id) {
      return res.status(400).json({
        status: false,
        message: "You are not authorised to do this operation",
      });
    }

    if (user.length === 0) {
      return res.status(400).json({
        status: false,
        message: "User not found.",
      });
    }

    //image update handling
    const imagePath = req.file ?req.file.path.replace(/\\/g, "/") : null;
    let updatedImage = user[0].image; // defaulting updated image as existing image

    try {
      if (imagePath && imagePath !== user[0].image) {
        //if new image is updated and new image is not equal to user.image
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        //path to old image
        const oldImage = path.join(
          __dirname,
          "..",
          "..",
          "uploads",
          "user",
          path.basename(user[0].image)
        );
        console.log("Old image path:", oldImage);
        console.log("File exists?", fs.existsSync(oldImage));
        if (fs.existsSync(oldImage)) {
          //checks if image exists
          //deleting image
          fs.unlink(oldImage, (err) => {
            if (err) {
              console.log("Error deleting image", err.message);
            } else {
              console.log("Image deleted successfully");
            }
          });
        }
        updatedImage = imagePath;
      }
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: `Error updating image',${error.message}`,
      });
    }

    const [updateDetails] = await User.query(
      `UPDATE user_table SET name=?,image=?,city=? WHERE id = ?`,
      [name, updatedImage, city, id]
    );

    if (updateDetails.changedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "Error updating profile data.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Profile updated successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
  }
};

//update password
export const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "All fields are required.",
      });
    }

    const [user] = await User.query(`SELECT * FROM user_table WHERE id=?`, [
      id,
    ]);
    if (userId.toString() !== id) {
      return res.status(400).json({
        status: false,
        message: "You are not authorised to do this operation.",
      });
    }

    //passsword matching
    const isMatch = await comparepassword(oldPassword, user[0].password);
    if (!isMatch) {
      return res.status(400).json({
        status: false,
        message: "Password incorrect",
      });
    }
    if (oldPassword === newPassword) {
      return res.status(400).json({
        status: false,
        message: "Old Password and New Password cannot be same.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        message: "New Password and Confirm Password did not match.",
      });
    }
    const hashPass = await hashedpassword(newPassword);
    const [updatePassword] = await User.query(
      `UPDATE user_table SET password=? WHERE id = ?`,
      [hashPass, id]
    );

    if (updatePassword.changedRows === 0) {
      return res.status(400).json({
        status: false,
        message: "Error updating password.",
      });
    }
    return res.status(200).json({
      status: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

