module.exports = function(app){
    app.get('/', function(req, res){
        res.redirect('/posts')
    })
    app.use('/signup', require('./signup'))
    app.use('/sginin', require('./sginin'))
    app.use('/signout', require('./signout'))
    app.use('/posts', require('./posts'))
    app.use('/comments', require('./comments'))
}