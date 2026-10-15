import {FC} from 'react';
import {ForgottenPasswordProps} from '../ForgottenPasswordForm';
import {LoginFormProps} from '../LoginForm';
import {RegisterFormProps} from '../RegisterForm';

export type LoginComponent = FC<LoginFormProps>;
export type ForgottenPasswordComponent = FC<ForgottenPasswordProps>;
export type RegisterComponent = FC<RegisterFormProps>;
