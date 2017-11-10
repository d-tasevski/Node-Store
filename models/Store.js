
const mongoose = require('mongoose');
const slug = require('slugs');

mongoose.Promise = global.Promise;

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true, // trims unnecessary whitespace(data normalization)
        required: true
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    tags: [String],
    created: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            default: 'Point'
        },
        coordinates: [{
            type: Number,
            required: 'You must supply coordinates!'
        }],
        address: {
            type: String,
            required: 'You must supply address!'
        }
    },
    photo: String
});
// Set slug property before saving
storeSchema.pre('save', async function(next) {
    if (!this.isModified('name')) {
        next(); // skip it and
        return; // stop this func from running
    }
    this.slug = slug(this.name);
    // find other stores that have similar slug
    const slugRegex = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const storesWithSlug = await this.constructor.find({ slug: slugRegex });
    if (storesWithSlug.length) {
        this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
    }
    next();
});

storeSchema.statics.getTagsList = function () {
    return this.aggregate([
        { $unwind: '$tags' },
        /**
         * group everything based on the tag field, and then create a new field in each of those groups called count
         * each time we group one of ths items the count is going to sum itself by one
         */
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
    ]);
};

module.exports = mongoose.model('Store', storeSchema);
