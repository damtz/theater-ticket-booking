const express = require('express');
const app = express();
// 

// set the view engine to ejs
app.set('view engine', 'ejs');
// app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));
app.use('/public', express.static('public'));
app.use('/views', express.static('public'));
// ...

app.use('/images', express.static(__dirname + '/public/images'));
// index page
app.get('/', function (req, res) {
    res.render('pages/index');
});



app.get('/movie', (req, res) => {
    res.render('pages/movie');
});

app.get('/hallmaping', (req, res) => {
    res.render('pages/hallmaping');
});
app.get('/booking', (req, res) => {
    res.render('pages/booking');
});
app.get('/report', (req, res) => {
    res.render('pages/report');
});
// Route to handle edit page request

app.get('/edit', (req, res) => {
    res.render('/pages/edit');
});











app.listen(3002, () => {
    console.log('Server is listening on port 3002');
});
