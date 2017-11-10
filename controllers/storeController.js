const mongoose = require('mongoose');
const multer = require('multer'); // image upload validation and functionality
const jimp = require('jimp'); // for resizing images
const uuid = require('uuid'); // give unique ids to images

const Store = mongoose.model('Store');
const multerOptions = {
    /**
     * Photo uploading options.
     * I'm saving photo to memory of server until it uploads(not saving it to drive),
     * but there is option to save it to drive
     */
    storage: multer.memoryStorage(),
    fileFilter (req, file, next) { // check if its image
        const isPhoto = file.mimetype.startsWith('image/');
        if (isPhoto) {
            /**
             * if we pass just one argument to next it means that it is an error.
             * But if we call next(null, true) that means it worked,
             * and the second value that we've passed will go through.
             */
            next(null, true);
        } else {
            next({ message: 'That filetype isn\'t allowed' }, false);
        }
    }
};


exports.homePage = (req, res) => {
    res.render('index');
};

exports.addStore = (req, res) => {
    res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
    // check if there is no new file to resize
    if (!req.file) {
        next(); // skip to the next middleware
    }
    const extension = req.file.mimetype.split('/')[1];
    // rename photo
    req.body.photo = `${uuid.v4()}.${extension}`;
    // resize photo
    const photo = await jimp.read(req.file.buffer);
    await photo.resize(800, jimp.AUTO);
    await photo.write(`./public/uploads/${req.body.photo}`);
    // once photo is written to file system, continue
    next();
};

exports.createStore = async (req, res) => {
    const store = await (new Store(req.body)).save();
    req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
    res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
    // Query the database for a list of all stores
    const stores = await Store.find(); // Will query the db for all stores
    res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
    // Find the store given the ID
    const store = await Store.findOne({ _id: req.params.id });
    // confirm that user who's editing is the owner of the store

    // Render the edit form, so that user can update it
    res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
    // set the location data to be a point
    req.body.location.type = 'Point';
    // Find and update the store
    const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true, // return the new store instead of the old one
        runValidators: true // Validate data
    }).exec(); // To assure that we run the query, bcs some of them wont run sometimes
    req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store</a>`);
    res.redirect(`/stores/${store._id}/edit`);
    // Redirect to the store and tell that it worked
};

exports.getStoreBySlug = async (req, res, next) => {
    const store = await Store.findOne({ slug: req.params.slug });

    if (!store) return next();

    res.render('store', { store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
    const tags = await Store.getTagsList();
    const tag = req.params.tag;
    res.render('tag', { tag, tags, title: 'Tags' });
};
