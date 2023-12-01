/* global describe expect test */
import { emailRE } from 'regex-repo'

import { determineAuthorEmail } from '../config'

describe('determineAuthorEmail', () => {
  test('gets some email', () => expect(determineAuthorEmail()).toMatch(emailRE))
})
