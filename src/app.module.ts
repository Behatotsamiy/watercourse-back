import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { AuthModule } from './_auth/auth.module';
import { GroupsModule } from './groups/groups.module';
import { PaymentsModule } from './payments/payments.module';
import { CoursesModule } from './courses/courses.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ScheduleModule } from './schedule/schedule.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
     useFactory: (configService: ConfigService) => {
  const databaseUrl = configService.get('DATABASE_URL');

  // Если есть строка подключения (Render / Neon), работаем по ней
if (databaseUrl) {
  const url = new URL(databaseUrl);
  return {
    type: 'postgres',
    host: url.hostname,
    port: 5432,
    username: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    autoLoadEntities: true,
    synchronize: true,
    ssl: {
      rejectUnauthorized: false,
    },
  };
}

  // Если строки нет (локалка), берем обычные переменные из .env
  return {
    type: 'postgres',
    host: configService.get('DB_HOST') || 'localhost',
    port: +configService.get('DB_PORT') || 5433,
    username: configService.get('DB_USERNAME') || 'postgres',
    password: configService.get('DB_PASSWORD') || 'root',
    database: configService.get('DB_NAME') || 'watercourse',
    autoLoadEntities: true,
    synchronize: true,
    logging: true,
    uuidExtension: 'pgcrypto',
  };
},
    }),UsersModule, StudentsModule, AuthModule, GroupsModule, PaymentsModule, CoursesModule, AttendanceModule, ScheduleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
