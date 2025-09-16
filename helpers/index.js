const sendEmail = require('./sendEmail');
const sendResetPasswordEmail = require('./sendResetPasswordEmail');
const sendVerificationEmail = require('./sendVerficationEmail');
const sendGameVerificationEmail = require('./sendGameVerificationEmail');
const sendGameResetPasswordEmail = require('./sendGameResetPasswordEmail');

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendResetPasswordEmail,
    sendGameVerificationEmail,
    sendGameResetPasswordEmail,
};
