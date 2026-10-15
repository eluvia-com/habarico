import {LayoutUser} from '../types';
import {_fullName, _id} from './utils';

export const _currentUser: LayoutUser = {
  id: _id(0),
  fullName: _fullName(0),
  email: 'john.doe@example.com',
  avatar: 'https://i.pravatar.cc/300?img=1',
};
