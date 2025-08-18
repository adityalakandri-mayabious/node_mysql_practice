import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, 
  auth: {
    user: "bunnyb12135@gmail.com",
    pass: 'arjn dwcd lxys efiq',
  },
});