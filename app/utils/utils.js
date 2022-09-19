const validateEmail  = email => {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}
const addMinutes = (m) => {
    const now = new Date()
    return new Date(now.setMinutes(now.getMinutes() + parseInt(m)))
}
module.exports = {
    validateEmail,
    addMinutes
}