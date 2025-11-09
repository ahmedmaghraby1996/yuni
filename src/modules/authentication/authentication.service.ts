import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GoogleSigninRequest, LoginRequest } from './dto/requests/signin.dto';
import { Inject } from '@nestjs/common/decorators';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  AgentRegisterRequest,
  RegisterRequest,
} from './dto/requests/register.dto';
import { SendOtpRequest } from './dto/requests/send-otp.dto';
import { VerifyOtpRequest } from './dto/requests/verify-otp.dto';
import { RegisterUserTransaction } from './transactions/register-user.transaction';
import { SendOtpTransaction } from './transactions/send-otp.transaction';
import { UserService } from '../user/user.service';
import { VerifyOtpTransaction } from './transactions/verify-otp.transaction';
import { jwtSignOptions } from 'src/core/setups/jwt.setup';
import axios from 'axios';
import { Role } from 'src/infrastructure/data/enums/role.enum';

import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { Wallet } from 'src/infrastructure/entities/wallet/wallet.entity';
import { FirebaseAdminService } from '../notification/firebase-admin-service';
import { User } from 'src/infrastructure/entities/user/user.entity';
import * as jose from 'jose';
import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { access } from 'fs';
import { ResetPasswordRequest } from './dto/requests/reset-password';
import { RequestResetPassword } from './dto/requests/request-reset-password';
import { SendEmailService } from '../send-email/send-email.service';

import { AddSecurityGradeRequest } from './dto/requests/add-security-garde.request';

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject(UserService) private readonly userService: UserService,

    @Inject(RegisterUserTransaction)
    private readonly registerUserTransaction: RegisterUserTransaction,
    @Inject(SendOtpTransaction)
    private readonly sendOtpTransaction: SendOtpTransaction,
    @Inject(VerifyOtpTransaction)
    private readonly verifyOtpTransaction: VerifyOtpTransaction,
    @Inject(JwtService) private readonly jwtService: JwtService,

    @InjectRepository(Wallet) private readonly walletRepo: Repository<Wallet>,
    private readonly _firebase_admin_service: FirebaseAdminService,
    @Inject(REQUEST) private readonly request: Request,
    @Inject(SendEmailService)
    private readonly sendEmailService: SendEmailService,

    @Inject(ConfigService) private readonly _config: ConfigService,
  ) {}

  async validateUser(req: LoginRequest): Promise<any> {
    const user = await this.userService.findOne([
      { email: req.username },
      { username: req.username },
      { phone: req.username },
    ] as any);
    let isMatch = false;
    if (user) {
      isMatch = await bcrypt.compare(
        req.password + this._config.get('app.key'),
        user.password,
      );
    }
    if (user && isMatch) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    if (!user) throw new BadRequestException('message.invalid_credentials');
    const payload = { username: user.username, sub: user.id };
    return {
      ...user,
      access_token: this.jwtService.sign(payload, jwtSignOptions(this._config)),
    };
  }
  async googleSignin(req: GoogleSigninRequest) {
    return axios
      .get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${req.token}`,
      )
      .then(async (response) => {
        const userInfo = response.data;

        const user = await this.userService._repo.findOne({
          where: [{ id: userInfo.id }, { email: userInfo.email }],
        });

        if (!user) {
          const newUser = new User({
            ...userInfo,
            role: Role.CLIENT,
            username: userInfo.email,
            email: userInfo.email,
            avatar: userInfo.picture,
          });
          return {
            ...(await this.userService._repo.save(newUser)),
            role: Role.CLIENT,
            access_token: this.jwtService.sign(
              { username: user.email, sub: user.id },
              jwtSignOptions(this._config),
            ),
          };
        } else
          return {
            ...user,
            role: Role.CLIENT,
            access_token: this.jwtService.sign(
              { username: user.email, sub: user.id },
              jwtSignOptions(this._config),
            ),
          };
      })

      .catch((error) => {
        throw new UnauthorizedException(error.response.data.error); // error.response.data;
      });
  }

  async getAppleUserFromToken(idToken) {
    try {
      // Step 1: Fetch Apple's public keys
      const { data: appleKeys } = await axios.get(
        'https://appleid.apple.com/auth/keys',
      );

      // Step 2: Decode the token header to identify which key was used
      const decodedHeader = this.jwtService.decode(idToken, {
        complete: true,
      }).header;

      // Step 3: Find the matching key by `kid`
      const key = appleKeys.keys.find((k) => k.kid === decodedHeader.kid);
      if (!key)
        throw new Error('Apple public key not found for the given token.');

      let applePublicKey;

      // Step 4: Check if `x5c` exists and use it if available
      if (key.x5c && key.x5c[0]) {
        applePublicKey = `-----BEGIN PUBLIC KEY-----\n${key.x5c[0]}\n-----END PUBLIC KEY-----`;
      } else {
        // If `x5c` is missing, construct the RSA public key using `n` and `e`
        const jwk = {
          kty: 'RSA',
          n: key.n,
          e: key.e,
        };
        const rsaKey = await jose.importJWK(jwk, 'RS256');
        applePublicKey = rsaKey; // Now we have a usable RSA key object
      }

      // Step 5: Verify the token using the constructed public key
      const decodedToken = await jose.jwtVerify(idToken, applePublicKey, {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com', // Verify the issuer as additional security
      });

      // Step 6: Extract user information from the decoded token payload
      const userId = decodedToken.payload.sub.split('.')[1];
      const email = decodedToken.payload.email as string;
      const name = decodedToken.payload.name as string;
      console.log(decodedToken.payload);
      const access_token = this.jwtService.sign(
        { username: email, sub: userId },
        jwtSignOptions(this._config),
      );
      let user = await this.userService._repo.findOneBy({ id: userId });
      if (!user) {
        user = new User({
          id: userId,
          username: email,
          roles: [Role.CLIENT],
          email,
          name: name ?? '',
        });
        user = await this.userService._repo.save(user);
      }

      return { ...user, access_token, role: Role.CLIENT };
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
  }

  async register(req: any) {
    const user = await this.registerUserTransaction.run(req);

    return user;
  }

  async sendOtp(req: SendOtpRequest) {
    return await this.sendOtpTransaction.run(req);
  }

  async verifyOtp(req: VerifyOtpRequest) {
    return await this.verifyOtpTransaction.run(req);
  }

  async resetPassword(resetToken: string, req: ResetPasswordRequest) {
    const { newPassword } = req;
    const payload = this.jwtService.verify(resetToken, {
      secret: this._config.get<string>('app.key'),
    });
    const user = await this.userService.findOne([
      { username: payload.username },
    ] as any);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.password = await bcrypt.hash(
      newPassword + this._config.get('app.key'),
      10,
    );
    await user.save();

    const newPayload = { username: user.username, sub: user.id };
    return {
      ...user,
      access_token: this.jwtService.sign(
        newPayload,
        jwtSignOptions(this._config),
      ),
    };
  }

  async requestResetPassword(req: RequestResetPassword) {
    const user = await this.userService.findOne([{ email: req.email }] as any);

    if (!user) {
      throw new BadRequestException('Email not found');
    }

    const token = this.jwtService.sign(
      { username: user.username },
      { secret: this._config.get<string>('app.key'), expiresIn: '1h' },
    );
    const resetPasswordUrl =
      'https://admin.nadnee.click/auth/reset-password/' + token;

    await this.sendEmailService.sendResetPasswordEmail(
      user.email,
      resetPasswordUrl,
    );

    return true;
  }

  async registerAgent(req: AgentRegisterRequest) {
    const user = this.request.user;

    Object.assign(req, {
      role: Role.AGENT,
    });

    // Assign req fields into user
    Object.assign(user, req);
    await this.walletRepo.save(new Wallet({ user_id: user.id, balance: 0 }));

   return await this.userService._repo.save(user);
  }

  // async removeSecurityGrade(req: AddSecurityGradeRequest) {
  //   const user = await this.userService.findOne(req.user_id);
  //   const grades = await this.gradeRepo.find({ where: { id: In(req.grades_ids) } });
  //   user.grades = user.grades.filter((grade) => !grades.includes(grade));
  // }
}
