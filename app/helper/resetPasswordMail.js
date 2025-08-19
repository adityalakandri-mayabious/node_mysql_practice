import { transporter } from "../config/emailConfig.js";

export const sendResetPasswordMail = async(user,resetLink)=>{
    await transporter.sendMail({
        from:'bunnyb12135@gmail.com',
        to:user[0].email,
        subject:'Reset Password Link.',
        html:`<h4>Dear ${user[0].name}, <br/>
        Please <a href="${resetLink}">Click here</a> to reset your password.
        </h4>`
    })
}