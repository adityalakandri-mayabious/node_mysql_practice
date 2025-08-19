import multer from 'multer';


const FILE_MAP_TYPE ={
    'image/png':'png',
    'image/jpg':'jpg',
    'image/jpeg':'jpeg',
}


const storage = multer.diskStorage({
    destination:function(req,file,cb){
        const isValid = FILE_MAP_TYPE[file.mimetype];
        let uploadError = new Error('Invalid FileType');
        if(isValid){
            uploadError = null;
        }
        cb(uploadError,'uploads/user')
    },
    filename: function(req,file,cb){
        const originalName = file.originalname.split(' ').join('-');
        const extensionType = FILE_MAP_TYPE[file.mimetype];
        cb(null,`${originalName}-${Date.now()}.${extensionType}`)
    }
})


const Image = multer({storage:storage});
const blogImage = Image.array('image',5);

export default blogImage;

