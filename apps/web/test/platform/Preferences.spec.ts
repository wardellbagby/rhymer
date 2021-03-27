import { expect, use } from 'chai';
import sinon from 'ts-sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { WebPreferences } from '@web-app/platform/Preferences';
import { PreferencesData } from '@lyricistant/common/preferences/PreferencesData';
import { Preferences } from '@lyricistant/common/preferences/Preferences';

use(sinonChai);
use(chaiAsPromised);

describe('Preferences', () => {
  let preferences: Preferences;

  beforeEach(() => {
    sinon.reset();
    preferences = new WebPreferences();
  });

  it('round-trip works', async () => {
    const expected: PreferencesData = {
      textSize: 2,
    };

    preferences.setPreferences(expected);

    const actual = preferences.getPreferences();

    expect(expected).to.deep.equal(actual);
  });

  it('updates work', async () => {
    const initial: PreferencesData = {
      textSize: 24,
    };
    const expected: PreferencesData = {
      textSize: 2,
    };

    preferences.setPreferences(initial);
    preferences.setPreferences(expected);

    const actual = preferences.getPreferences();

    expect(expected).to.deep.equal(actual);
  });
});
