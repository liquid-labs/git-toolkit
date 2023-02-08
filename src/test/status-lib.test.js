/* globals describe expect test */
import * as fsPath from 'node:path'

import shell from 'shelljs'

import { verifyClean, verifyReadyForRelease } from '../status-lib'

describe('verifyClean', () => {
  test.each([
    [ 'repo_a_clone', 'on not-main branch' ],
    [ 'repo_a_clone_2', 'on main branch' ]
  ])("'%s' %s is clean", (repo, branch) =>
    expect(() => verifyClean({ projectPath: fsPath.join('src', 'test', 'data', repo) })).not.toThrow())
})