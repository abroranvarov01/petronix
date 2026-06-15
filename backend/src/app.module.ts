import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { BannersModule } from './banners/banners.module';
import { AuthModule } from './auth/auth.module';
import { UploadModule } from './upload/upload.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    SubcategoriesModule,
    BannersModule,
    UploadModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
