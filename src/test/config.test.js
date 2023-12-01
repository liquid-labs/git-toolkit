/* global describe expect test */
import { email as emailRE } from 'regex-repo'

import { determineAuthorEmail } from '../config'

describe('determineAuthorEmail', () => {
  test('gets some email', () => expect(determineAuthorEmail()).toMatch(emailRE))
})
