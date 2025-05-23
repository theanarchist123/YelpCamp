const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const Joi = require('joi');
const { campgroundSchema } = require('./schemas.js');
const catchAsync = require('./utils/catchAsync');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const Campground = require('./models/camp');

mongoose.connect('mongodb://localhost:27017/kalix' , {
    useNewUrlParser: true,
    
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB");
});
const app = express();
app.engine('ejs', ejsMate )
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const validateCampground = (req, res, next) => {

    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}
app.get('/', (req,res) => {
    res.render('home');
});

app.get('/campgrounds', async (req,res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
});


app.get('/campgrounds/new', (req,res) => {
    res.render('campgrounds/new');
});
app.post('/campgrounds', validateCampground, catchAsync(async (req,res,next) => {
   // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400);
   const campgroundSchema = Joi.object({
     campground: Joi.object({
         title: Joi.string().required(),
         price: Joi.number().required().min(0),
         image: Joi.string().required(),
         description: Joi.string().required(),
         location: Joi.string().required()
     }).required()
   })
   const { error } = campgroundSchema.validate(req.body);
   if(error){
       const msg = error.details.map(el => el.message).join(',')
       throw new ExpressError(msg, 400);
   }   
   console.log(result);
        const campground = new Campground(req.body.campground);
        await campground.save();
        res.redirect(`/campgrounds/${campground._id}`);

}));

app.get('/campgrounds/:id', catchAsync(async (req,res) => {
    const campground = await Campground.findById(req.params.id);
    res.render('campgrounds/show' , { campground });
}));

app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render('campgrounds/edit', { campground });
}));

app.put('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
    res.redirect(`/campgrounds/${campground._id}`)
}));

app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campgrounds');
}));

app.all('*', (req, res ,next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next)=>{
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error' , { err });
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});