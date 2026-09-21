const mongoose = require('mongoose');

async function fixBanners() {
    await mongoose.connect('mongodb://127.0.0.1:27017/books_river_db_name_here_or_bichitra_point'); // need to find exact db name
}

fixBanners();
