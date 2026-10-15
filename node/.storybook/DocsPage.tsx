import React from 'react';
import {Controls, Description, Primary, Stories, Subtitle, Title, useOf} from '@storybook/addon-docs/blocks';

/**
 * Storybook's default autodocs template lists every story a second time under "Stories", the
 * primary one (always the first export — `Playground`, by convention) included: a second, static
 * embed of the exact same story already shown live at the top, minus the Controls panel that made
 * it worth calling "interactive" in the first place. `includePrimary={false}` on `<Stories>` is the
 * one change from Storybook's built-in `DocsPage` — everything else (title, description, the live
 * primary embed + props table, every other Showcase story) is unchanged.
 */
export const DocsPage = () => {
  const {csfFile} = useOf('meta', ['meta']);
  const isSingleStory = Object.keys(csfFile.stories).length === 1;
  return (
    <>
      <Title />
      <Subtitle />
      <Description />
      {isSingleStory && <Description of={'story'} />}
      <Primary />
      <Controls />
      <Stories includePrimary={false} />
    </>
  );
};
