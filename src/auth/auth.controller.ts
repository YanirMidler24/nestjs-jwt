/* eslint-disable prettier/prettier */

import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from 'src/DTO';
import { Tokens } from 'src/Types';
import { HttpStatus } from '@nestjs/common';
import { GetCurrentUser, GetCurrentUserId, Public } from './common/decorators';
import { RtGuard } from './common/guards';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('local/signup')
  @HttpCode(HttpStatus.CREATED)
  signupLocal(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.signupLocal(dto);
  }

  @Public()
  @Post('local/signin')
  @HttpCode(HttpStatus.OK)
  signuinLocal(@Body() dto: AuthDto): Promise<Tokens> {
    return this.authService.signuinLocal(dto);
  }


  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@GetCurrentUserId() userId: number) {
    return this.authService.logout(userId)
    // return this.authService.logout();
  }

  @UseGuards(RtGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string
  ) {

    return this.authService.refreshTokens(userId, refreshToken);
  }
}


