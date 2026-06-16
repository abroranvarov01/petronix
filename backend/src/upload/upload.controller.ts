import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthGuard } from '../auth/auth.guard';

const UPLOAD_DIR = 'uploads';
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
// Whitelist the extension too — never blindly trust the original filename.
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('upload')
@UseGuards(AuthGuard) // authenticated users only — no anonymous uploads
export class UploadController {
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          const safeExt = ALLOWED_EXT.includes(ext) ? ext : '.jpg';
          const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          cb(null, `${unique}${safeExt}`);
        },
      }),
      limits: { fileSize: MAX_SIZE, files: 1 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (!ALLOWED_MIMES.includes(file.mimetype) || !ALLOWED_EXT.includes(ext)) {
          return cb(
            new BadRequestException('Faqat JPEG, PNG va WebP formatlar qabul qilinadi'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Fayl tanlanmagan');
    }
    return { path: `/uploads/${file.filename}` };
  }
}
