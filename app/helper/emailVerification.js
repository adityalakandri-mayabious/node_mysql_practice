import { transporter } from "../config/emailConfig.js";
import otpTable from "../config/db.js"

export const sendEmailVerification = async(req,user)=>{
    const otp = Math.floor(1000 + Math.random()*9000);
    const saveOtp = await otpTable.query(`INSERT INTO otp_table (user_id,otp) VALUES(?,?)`,[user[0].id,otp]);

    await transporter.sendMail({
        from : 'bunnyb@12135@gmail.com',
        to:user[0].email,
        subject:'Verify your account.',
        html:`<h4>Dear ${user[0].name}, <br> Your One Time Password for Account verifiction is ${otp}.</h4>`
    })
    return otp;
}