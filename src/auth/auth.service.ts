import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { UserRole } from '../common/enums';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.save(
      this.users.create({
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role ?? UserRole.STUDENT,
        phone: dto.phone ?? null,
        profile: dto.major ? { major: dto.major } : null,
      }),
    );
    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    let user = await this.users.findOne({ where: { email: dto.email } });
    if (!user) {
      user = await this.users.findOne({ where: { phone: dto.email } });
    }
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.issueToken(user);
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.users.findOne({ where: { id } });
    if (!user || !(await bcrypt.compare(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.users.save(user);
    return { message: 'Password updated' };
  }

  async me(id: number) {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new UnauthorizedException('User not found');
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  private async issueToken(user: User) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { accessToken, user: safeUser };
  }
}
