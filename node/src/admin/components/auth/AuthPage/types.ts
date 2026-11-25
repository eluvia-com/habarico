import {ComponentType, FC} from 'react';
import {ForgottenPasswordProps} from '../ForgottenPasswordForm';
import {LoginFormProps} from '../LoginForm';
import {RegisterFormProps} from '../RegisterForm';

export type LoginComponent = FC<LoginFormProps>;
export type ForgottenPasswordComponent = FC<ForgottenPasswordProps>;
export type RegisterComponent = FC<RegisterFormProps>;

/** Content shown under the login form, such as a link to the terms of service. */
export type LoginNoticeSlot = {Component: ComponentType};
