import React, {forwardRef} from 'react';
import {Link, LinkProps} from 'react-router-dom';

export type RouterLinkProps = Omit<LinkProps, 'to'> & {
  href: string;
};

export const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(
  ({href, ...other}, ref) => <Link ref={ref} to={href} {...other} />
);

RouterLink.displayName = 'RouterLink';
