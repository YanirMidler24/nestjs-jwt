/* eslint-disable prettier/prettier */

import { Injectable } from '@nestjs/common';
import { AuthDto } from 'src/DTO';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Tokens } from 'src/Types';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) { }

  async signupLocal(dto: AuthDto): Promise<Tokens> {
    const hash = await this.hashData(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
      }
    });

    const tokens = await this.getTokens(newUser.id, newUser.email);
    await this.updateRtHash(newUser.id, tokens.refresh_token);
    return tokens;
  }

  async signuinLocal(dto: AuthDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      }
    })
    if (!user || !user.hasedRt) throw new ForbiddenException("Access Denied")

    const passportMatches = await bcrypt.compare(dto.password, user.hash);

    if (!passportMatches) throw new ForbiddenException("Access Denied")

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;

  }

  async logout(userId: number) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hasedRt: {
          not: null,
        },
      },
      data: {
        hasedRt: null,
      },
    });
  }

  async refreshTokens(userId: number, rt: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      }
    })
    if (!user) throw new ForbiddenException("Access Dennied")

    const rtMatches = await bcrypt.compare(rt, user.hasedRt)
    if (!rtMatches) throw new ForbiddenException("Access Dennied")

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  async updateRtHash(userId: number, rt: string) {
    const hash = await this.hashData(rt);
    await this.prisma.user.update({
      where: {
        id: userId
      },
      data: {
        hasedRt: hash,
      }
    })
  }

  hashData(data: string) {
    return bcrypt.hash(data, 10)
  };

  async getTokens(userId: number, email: string): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.JwtService.signAsync({
        sub: userId,
        email,
      }, {
        secret: 'at-secret',
        expiresIn: 60 * 15,
      }),
      this.JwtService.signAsync({
        sub: userId,
        email,
      }, {
        secret: 'rt-secret',
        expiresIn: 60 * 60 * 24 * 7,
      })
    ])
    return {
      access_token: at,
      refresh_token: rt,
    }
  }
}