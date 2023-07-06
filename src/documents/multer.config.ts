import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';

export const multerConfig = {
  dest: './uploads',
  limits: {
    fileSize: 10 * 1024 * 1024, // Tamaño máximo del archivo en bytes (10 MB en este ejemplo)
  },
  storage: diskStorage({
    destination: (req, file, cb) => {
      cb(null, './uploads');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = uuidv4();
      cb(null, `${Date.now()}-${uniqueSuffix}-${file.originalname}`);
    },
  }),
};