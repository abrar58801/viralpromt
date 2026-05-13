const multer = require('multer');
const path = require('path');

// Storage
const storage =
    multer.diskStorage({

    destination:
        './public/uploads/',

    filename:
        function (
            req,
            file,
            cb
        ) {

        cb(
            null,

            file.fieldname +
            '-' +
            Date.now() +

            path.extname(
                file.originalname
            )
        );
    }

});

// Upload
const upload =
    multer({

    storage,

    limits: {

        fileSize: 10000000 // 10MB
    }

}).fields([

    // Prompt Images
    {
        name: 'before_image',
        maxCount: 1
    },

    {
        name: 'after_image',
        maxCount: 1
    },

    // Settings Images
    {
        name: 'header_logo',
        maxCount: 1
    },

    {
        name: 'paytm_qr',
        maxCount: 1
    }

]);

module.exports = upload;