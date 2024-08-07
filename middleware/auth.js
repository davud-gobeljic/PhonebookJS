// Middleware za proveru da li je korisnik admin
module.exports.isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
      return next();
    }
    res.redirect('/'); // Preusmeri na početnu stranicu ako nije admin
};
