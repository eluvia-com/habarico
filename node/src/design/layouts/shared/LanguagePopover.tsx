import React from 'react';
import {IconButton, IconButtonProps, MenuItem, MenuList, menuItemClasses} from '@mui/material';
import {FlagIcon} from '../../atoms/FlagIcon';
import {usePopover} from '../../hooks/usePopover';
import {useSettingsContext} from '../contexts/SettingsContext';
import {LayoutLanguage} from '../types';

export type LanguagePopoverProps = Omit<IconButtonProps, 'onChange'> & {
  availableLanguages: LayoutLanguage[];
};

/**
 * Language switcher shared by all shells (Dashboard / Auth / Simple). The available
 * languages come in as a prop; the current locale and its setter are read from
 * `SettingsContext`. Renders nothing when there is fewer than two languages or the
 * current locale is unknown.
 */
export function LanguagePopover({availableLanguages, sx, ...rest}: LanguagePopoverProps) {
  const {locale, setLocale} = useSettingsContext();
  const currentLanguage = availableLanguages.find((lang) => lang.locale === locale);
  const {Popover, openPopover, closePopover, open} = usePopover();

  if (availableLanguages.length < 2 || !currentLanguage) return null;

  return (
    <>
      <IconButton
        onClick={openPopover}
        sx={{
          width: 40,
          height: 40,
          ...(open && {backgroundColor: 'action.selected'}),
          ...sx,
        }}
        {...rest}
      >
        <FlagIcon code={currentLanguage.locale.split('-').at(-1) ?? currentLanguage.locale} />
      </IconButton>
      <Popover
        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
        transformOrigin={{vertical: 'top', horizontal: 'right'}}
      >
        <MenuList
          sx={{
            p: 0.5,
            width: 160,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              [`&.${menuItemClasses.selected}`]: {
                backgroundColor: 'action.selected',
                fontWeight: 'fontWeightSemiBold',
              },
            },
          }}
        >
          {availableLanguages.map((language) => (
            <MenuItem
              key={language.locale}
              selected={language.locale === locale}
              onClick={() => {
                closePopover();
                setLocale(language.locale);
              }}
            >
              <FlagIcon code={language.locale.split('-').at(-1) ?? language.locale} />
              {language.title}
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
}
