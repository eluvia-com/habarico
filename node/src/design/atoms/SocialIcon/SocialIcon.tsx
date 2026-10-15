import React from 'react';
import {SvgIconProps} from '@mui/material';
import {FacebookIcon} from './FacebookIcon';
import {GitHubIcon} from './GitHubIcon';
import {GoogleIcon} from './GoogleIcon';
import {InstagramIcon} from './InstagramIcon';
import {LinkedInIcon} from './LinkedInIcon';
import {TwitterIcon} from './TwitterIcon';
import {XIcon} from './XIcon';
import {SocialIconType} from './enums';

export type SocialIconProps = SvgIconProps & {
  icon: SocialIconType;
};

export const SocialIcon = ({icon, ...rest}: SocialIconProps) => {
  if (icon === SocialIconType.Facebook) {
    return <FacebookIcon {...rest} />;
  } else if (icon === SocialIconType.GitHub) {
    return <GitHubIcon {...rest} />;
  } else if (icon === SocialIconType.Google) {
    return <GoogleIcon {...rest} />;
  } else if (icon === SocialIconType.Instagram) {
    return <InstagramIcon {...rest} />;
  } else if (icon === SocialIconType.LinkedIn) {
    return <LinkedInIcon {...rest} />;
  } else if (icon === SocialIconType.Twitter) {
    return <TwitterIcon {...rest} />;
  } else if (icon === SocialIconType.X) {
    return <XIcon {...rest} />;
  }
  return null;
};
